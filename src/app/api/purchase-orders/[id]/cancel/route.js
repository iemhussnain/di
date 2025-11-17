import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseOrder from '@/lib/models/PurchaseOrder'

/**
 * POST /api/purchase-orders/[id]/cancel
 * Cancel a purchase order
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Please provide a cancellation reason' },
        { status: 400 }
      )
    }

    const purchaseOrder = await PurchaseOrder.findById(params.id)

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Cancel the order
    await purchaseOrder.cancel(reason)

    // Populate references
    await purchaseOrder.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'created_by', select: 'name' },
      { path: 'approved_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling purchase order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel purchase order' },
      { status: 500 }
    )
  }
}
