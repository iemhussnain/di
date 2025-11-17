import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseInvoice from '@/lib/models/PurchaseInvoice'

/**
 * POST /api/purchase-invoices/[id]/cancel
 * Cancel a purchase invoice
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has cancellation permission
    if (token.role !== 'Admin' && token.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to cancel invoices' },
        { status: 403 }
      )
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

    const purchaseInvoice = await PurchaseInvoice.findById(params.id)

    if (!purchaseInvoice) {
      return NextResponse.json(
        { error: 'Purchase invoice not found' },
        { status: 404 }
      )
    }

    // Cancel the invoice
    await purchaseInvoice.cancel(reason)

    // TODO: Reverse journal entries if posted

    // Populate references
    await purchaseInvoice.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'purchase_order_id', select: 'order_number' },
      { path: 'created_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseInvoice,
      message: 'Purchase invoice cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling purchase invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel purchase invoice' },
      { status: 500 }
    )
  }
}
