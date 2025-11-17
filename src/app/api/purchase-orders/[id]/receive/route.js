import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseOrder from '@/lib/models/PurchaseOrder'

/**
 * POST /api/purchase-orders/[id]/receive
 * Mark items as received (full or partial)
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()
    const { received_quantity } = body

    if (!received_quantity || received_quantity <= 0) {
      return NextResponse.json(
        { error: 'Please provide a valid received quantity' },
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

    // Mark as received
    await purchaseOrder.markReceived(received_quantity)

    // Populate references
    await purchaseOrder.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'created_by', select: 'name' },
      { path: 'approved_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: purchaseOrder.status === 'Received'
        ? 'Purchase order fully received'
        : 'Purchase order partially received',
    })
  } catch (error) {
    console.error('Error receiving purchase order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to receive purchase order' },
      { status: 500 }
    )
  }
}
