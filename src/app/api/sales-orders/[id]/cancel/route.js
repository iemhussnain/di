/**
 * Sales Order Cancel API Route
 * POST: Cancel sales order
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import SalesOrder from '@/lib/models/SalesOrder'
import { cancelSalesOrderSchema } from '@/lib/validation/salesOrder'

/**
 * POST /api/sales-orders/[id]/cancel
 * Cancel sales order
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = cancelSalesOrderSchema.parse(body)

    // Find sales order
    const salesOrder = await SalesOrder.findById(params.id)

    if (!salesOrder) {
      return NextResponse.json({ success: false, error: 'Sales order not found' }, { status: 404 })
    }

    // Cancel order
    await salesOrder.cancelOrder(validatedData.cancelled_by, validatedData.cancellation_reason)

    return NextResponse.json({
      success: true,
      message: 'Sales order cancelled successfully',
      data: salesOrder,
    })
  } catch (error) {
    console.error('POST /api/sales-orders/[id]/cancel error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel sales order' },
      { status: 500 }
    )
  }
}
