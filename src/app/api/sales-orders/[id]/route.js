/**
 * Sales Order API Route - Single Order
 * GET: Get sales order by ID
 * PUT: Update sales order
 * DELETE: Delete sales order
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import SalesOrder from '@/lib/models/SalesOrder'
import { updateSalesOrderSchema } from '@/lib/validation/salesOrder'

/**
 * GET /api/sales-orders/[id]
 * Get single sales order
 */
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const salesOrder = await SalesOrder.findById(params.id)
      .populate('customer_id', 'customer_code customer_name phone email address credit_limit')
      .populate('lines.item_id', 'item_code item_name unit_of_measure')
      .populate('created_by', 'name email')
      .populate('confirmed_by', 'name email')
      .populate('invoiced_by', 'name email')
      .populate('delivered_by', 'name email')

    if (!salesOrder) {
      return NextResponse.json({ success: false, error: 'Sales order not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: salesOrder,
    })
  } catch (error) {
    console.error('GET /api/sales-orders/[id] error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales order' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sales-orders/[id]
 * Update sales order
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = updateSalesOrderSchema.parse(body)

    // Find sales order
    const salesOrder = await SalesOrder.findById(params.id)

    if (!salesOrder) {
      return NextResponse.json({ success: false, error: 'Sales order not found' }, { status: 404 })
    }

    // Check if editable
    if (!salesOrder.is_editable) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot edit sales order in ${salesOrder.status} status. Only Draft orders can be edited.`,
        },
        { status: 400 }
      )
    }

    // Update fields
    Object.keys(validatedData).forEach((key) => {
      salesOrder[key] = validatedData[key]
    })

    await salesOrder.save()

    return NextResponse.json({
      success: true,
      message: 'Sales order updated successfully',
      data: salesOrder,
    })
  } catch (error) {
    console.error('PUT /api/sales-orders/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update sales order' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sales-orders/[id]
 * Delete sales order
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const salesOrder = await SalesOrder.findById(params.id)

    if (!salesOrder) {
      return NextResponse.json({ success: false, error: 'Sales order not found' }, { status: 404 })
    }

    // Only Draft orders can be deleted
    if (salesOrder.status !== 'Draft') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete sales order in ${salesOrder.status} status. Only Draft orders can be deleted.`,
        },
        { status: 400 }
      )
    }

    await SalesOrder.deleteOne({ _id: params.id })

    return NextResponse.json({
      success: true,
      message: 'Sales order deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/sales-orders/[id] error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to delete sales order' },
      { status: 500 }
    )
  }
}
