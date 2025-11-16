/**
 * Single Customer API Route
 * GET /api/customers/:id - Get single customer
 * PUT /api/customers/:id - Update customer
 * DELETE /api/customers/:id - Delete customer
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Customer from '@/lib/models/Customer'
import { updateCustomerSchema } from '@/lib/validation/customer'
import { errorHandler } from '@/lib/errors/errorHandler'
import mongoose from 'mongoose'

// GET /api/customers/:id
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid customer ID',
        },
        { status: 400 }
      )
    }

    const customer = await Customer.findById(id)

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: customer,
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}

// PUT /api/customers/:id
export async function PUT(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid customer ID',
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validatedData = updateCustomerSchema.parse(body)

    // Find existing customer
    const existingCustomer = await Customer.findById(id)

    if (!existingCustomer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      )
    }

    // Check if customer name is being changed and if new name already exists
    if (validatedData.customer_name && validatedData.customer_name !== existingCustomer.customer_name) {
      const duplicateCustomer = await Customer.findOne({
        customer_name: validatedData.customer_name,
        _id: { $ne: id },
      })

      if (duplicateCustomer) {
        return NextResponse.json(
          {
            success: false,
            error: 'Customer name already exists',
          },
          { status: 400 }
        )
      }
    }

    // Don't allow customer_code changes
    if (validatedData.customer_code) {
      delete validatedData.customer_code
    }

    // Update customer
    const customer = await Customer.findByIdAndUpdate(id, validatedData, {
      new: true,
      runValidators: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'PUT',
    })
  }
}

// DELETE /api/customers/:id
export async function DELETE(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid customer ID',
        },
        { status: 400 }
      )
    }

    const customer = await Customer.findById(id)

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      )
    }

    // Check if customer has outstanding balance
    if (customer.current_balance !== 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete customer with outstanding balance: ${Math.abs(customer.current_balance).toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // TODO: Check if customer has any invoices
    // const invoicesCount = await Invoice.countDocuments({ customer_id: id })
    // if (invoicesCount > 0) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: 'Cannot delete customer with existing invoices',
    //     },
    //     { status: 400 }
    //   )
    // }

    // Soft delete by setting status to Inactive
    await Customer.findByIdAndUpdate(id, { status: 'Inactive' })

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully',
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'DELETE',
    })
  }
}
