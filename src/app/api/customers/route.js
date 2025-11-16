/**
 * Customers API Route
 * GET /api/customers - List all customers
 * POST /api/customers - Create new customer
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Customer from '@/lib/models/Customer'
import { createCustomerSchema, customerQuerySchema } from '@/lib/validation/customer'
import { errorHandler } from '@/lib/errors/errorHandler'

// GET /api/customers - List all customers
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)

    // Validate and parse query parameters
    const { page, limit, status, is_registered, search, city, outstanding, credit_exceeded } =
      customerQuerySchema.parse(queryParams)

    // Build filter
    const filter = {}

    if (status) {
      filter.status = status
    }

    if (is_registered !== undefined) {
      filter.is_registered = is_registered
    }

    if (city) {
      filter['address.city'] = city
    }

    if (search) {
      filter.$or = [
        { customer_code: { $regex: search, $options: 'i' } },
        { customer_name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    let query = Customer.find(filter).sort({ customer_code: 1 }).skip(skip).limit(limit).lean()

    const [customers, total] = await Promise.all([query, Customer.countDocuments(filter)])

    // Filter for outstanding balance or credit exceeded if requested
    let data = customers
    if (outstanding) {
      data = customers.filter((customer) => customer.current_balance < 0)
    }
    if (credit_exceeded) {
      data = customers.filter((customer) => {
        const outstandingBalance = -customer.current_balance
        return outstandingBalance > customer.credit_limit
      })
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}

// POST /api/customers - Create new customer
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()

    // Validate request body
    const validatedData = createCustomerSchema.parse(body)

    // Check if customer code already exists (if provided)
    if (validatedData.customer_code) {
      const existingCustomer = await Customer.findOne({
        customer_code: validatedData.customer_code,
      })

      if (existingCustomer) {
        return NextResponse.json(
          {
            success: false,
            error: 'Customer code already exists',
          },
          { status: 400 }
        )
      }
    }

    // Check if customer name already exists
    const existingCustomer = await Customer.findOne({
      customer_name: validatedData.customer_name,
    })

    if (existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer name already exists',
        },
        { status: 400 }
      )
    }

    // Set initial current_balance to opening_balance
    const customerData = {
      ...validatedData,
      current_balance: validatedData.opening_balance || 0,
    }

    // Create customer
    const customer = await Customer.create(customerData)

    return NextResponse.json(
      {
        success: true,
        message: 'Customer created successfully',
        data: customer,
      },
      { status: 201 }
    )
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'POST',
    })
  }
}
