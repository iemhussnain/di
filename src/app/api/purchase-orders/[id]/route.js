import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseOrder from '@/lib/models/PurchaseOrder'

/**
 * GET /api/purchase-orders/[id]
 * Get a single purchase order
 */
export async function GET(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const purchaseOrder = await PurchaseOrder.findById(params.id)
      .populate('vendor_id', 'name vendor_code email phone address')
      .populate('created_by', 'name email')
      .populate('approved_by', 'name email')

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    })
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase order' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/purchase-orders/[id]
 * Update a purchase order
 */
export async function PUT(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()

    const purchaseOrder = await PurchaseOrder.findById(params.id)

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Check if editable
    if (!purchaseOrder.is_editable) {
      return NextResponse.json(
        { error: 'Cannot edit purchase order that is not in draft or pending approval' },
        { status: 400 }
      )
    }

    // Update fields
    Object.assign(purchaseOrder, body)
    await purchaseOrder.save()

    // Populate references
    await purchaseOrder.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'created_by', select: 'name' },
      { path: 'approved_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order updated successfully',
    })
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update purchase order' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/purchase-orders/[id]
 * Delete a purchase order (only if in Draft status)
 */
export async function DELETE(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const purchaseOrder = await PurchaseOrder.findById(params.id)

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Only allow deletion if in Draft status
    if (purchaseOrder.status !== 'Draft') {
      return NextResponse.json(
        { error: 'Can only delete purchase orders in Draft status' },
        { status: 400 }
      )
    }

    await purchaseOrder.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Purchase order deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}
