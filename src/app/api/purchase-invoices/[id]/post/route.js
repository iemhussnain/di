import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseInvoice from '@/lib/models/PurchaseInvoice'

/**
 * POST /api/purchase-invoices/[id]/post
 * Post/finalize a purchase invoice (ready for payment)
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const purchaseInvoice = await PurchaseInvoice.findById(params.id)

    if (!purchaseInvoice) {
      return NextResponse.json(
        { error: 'Purchase invoice not found' },
        { status: 404 }
      )
    }

    // Post the invoice
    await purchaseInvoice.postInvoice()

    // TODO: Create journal entry for accounting
    // Example entry:
    // Dr. Inventory/Expense Account
    // Dr. Tax Input (if applicable)
    // Cr. Accounts Payable

    // Populate references
    await purchaseInvoice.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'purchase_order_id', select: 'order_number' },
      { path: 'created_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseInvoice,
      message: 'Purchase invoice posted successfully',
    })
  } catch (error) {
    console.error('Error posting purchase invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to post purchase invoice' },
      { status: 500 }
    )
  }
}
