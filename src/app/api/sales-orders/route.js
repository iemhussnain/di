/**
 * Sales Orders API Route
 * GET: List sales orders
 * POST: Create new sales order
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import SalesOrder from '@/lib/models/SalesOrder'
import { createSalesOrder } from '@/lib/sales/salesOrder'
import { createSalesOrderSchema, salesOrderQuerySchema } from '@/lib/validation/salesOrder'

/**
 * GET /api/sales-orders
 * List sales orders with filters and pagination
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = salesOrderQuerySchema.parse(query)

    // Build filter
    const filter = {}

    if (validatedQuery.customer_id) {
      filter.customer_id = validatedQuery.customer_id
    }

    if (validatedQuery.status) {
      filter.status = validatedQuery.status
    }

    if (validatedQuery.start_date || validatedQuery.end_date) {
      filter.order_date = {}
      if (validatedQuery.start_date) {
        filter.order_date.$gte = new Date(validatedQuery.start_date)
      }
      if (validatedQuery.end_date) {
        filter.order_date.$lte = new Date(validatedQuery.end_date)
      }
    }

    if (validatedQuery.search) {
      filter.$or = [
        { order_no: { $regex: validatedQuery.search, $options: 'i' } },
        { customer_name: { $regex: validatedQuery.search, $options: 'i' } },
        { reference_no: { $regex: validatedQuery.search, $options: 'i' } },
      ]
    }

    // Pagination
    const page = validatedQuery.page || 1
    const limit = validatedQuery.limit || 20
    const skip = (page - 1) * limit

    // Execute query
    const [orders, totalCount] = await Promise.all([
      SalesOrder.find(filter)
        .populate('customer_id', 'customer_code customer_name')
        .populate('lines.item_id', 'item_code item_name')
        .sort({ order_date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SalesOrder.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/sales-orders error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales orders' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sales-orders
 * Create new sales order
 */
export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = createSalesOrderSchema.parse(body)

    // Create sales order
    const salesOrder = await createSalesOrder(validatedData)

    return NextResponse.json(
      {
        success: true,
        message: 'Sales order created successfully',
        data: salesOrder,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/sales-orders error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create sales order' },
      { status: 500 }
    )
  }
}
