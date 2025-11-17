import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseOrder from '@/lib/models/PurchaseOrder'

/**
 * POST /api/purchase-orders/[id]/approve
 * Approve a purchase order
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has approval permission
    if (token.role !== 'Admin' && token.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve purchase orders' },
        { status: 403 }
      )
    }

    await dbConnect()

    const purchaseOrder = await PurchaseOrder.findById(params.id)

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Approve the order
    await purchaseOrder.approve(token.id)

    // Populate references
    await purchaseOrder.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'created_by', select: 'name' },
      { path: 'approved_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order approved successfully',
    })
  } catch (error) {
    console.error('Error approving purchase order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve purchase order' },
      { status: 500 }
    )
  }
}
