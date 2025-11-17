/**
 * Sales Order Confirm API Route
 * POST: Confirm sales order
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import SalesOrder from '@/lib/models/SalesOrder'
import { confirmSalesOrderSchema } from '@/lib/validation/salesOrder'
import { reduceInventoryForOrder } from '@/lib/sales/salesOrder'

/**
 * POST /api/sales-orders/[id]/confirm
 * Confirm sales order and reduce inventory
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = confirmSalesOrderSchema.parse(body)

    // Find sales order
    const salesOrder = await SalesOrder.findById(params.id)

    if (!salesOrder) {
      return NextResponse.json({ success: false, error: 'Sales order not found' }, { status: 404 })
    }

    // Confirm order
    await salesOrder.confirmOrder(validatedData.confirmed_by)

    // Reduce inventory (default to unregistered stock)
    await reduceInventoryForOrder(salesOrder._id, false)

    return NextResponse.json({
      success: true,
      message: 'Sales order confirmed successfully',
      data: salesOrder,
    })
  } catch (error) {
    console.error('POST /api/sales-orders/[id]/confirm error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to confirm sales order' },
      { status: 500 }
    )
  }
}
