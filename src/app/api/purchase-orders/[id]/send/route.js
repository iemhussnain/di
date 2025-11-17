import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseOrder from '@/lib/models/PurchaseOrder'

/**
 * POST /api/purchase-orders/[id]/send
 * Mark purchase order as sent to vendor
 */
export async function POST(req, { params }) {
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

    // Mark as sent
    await purchaseOrder.sendToVendor()

    // Populate references
    await purchaseOrder.populate([
      { path: 'vendor_id', select: 'name vendor_code email' },
      { path: 'created_by', select: 'name' },
      { path: 'approved_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order marked as sent to vendor',
    })
  } catch (error) {
    console.error('Error sending purchase order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send purchase order' },
      { status: 500 }
    )
  }
}
