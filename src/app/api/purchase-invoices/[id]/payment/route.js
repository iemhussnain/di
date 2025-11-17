import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseInvoice from '@/lib/models/PurchaseInvoice'

/**
 * POST /api/purchase-invoices/[id]/payment
 * Record a payment against purchase invoice
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()
    const { amount, payment_mode, transaction_reference, payment_date } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Please provide a valid payment amount' },
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

    // Check if amount exceeds due amount
    if (amount > purchaseInvoice.amount_due) {
      return NextResponse.json(
        { error: `Payment amount (${amount}) exceeds amount due (${purchaseInvoice.amount_due})` },
        { status: 400 }
      )
    }

    // Record payment
    await purchaseInvoice.recordPayment(amount)

    // Update payment details
    if (payment_mode) purchaseInvoice.payment_mode = payment_mode
    if (transaction_reference) purchaseInvoice.transaction_reference = transaction_reference
    if (payment_date) purchaseInvoice.payment_date = new Date(payment_date)

    await purchaseInvoice.save()

    // TODO: Create journal entry for payment
    // Example entry:
    // Dr. Accounts Payable
    // Cr. Bank/Cash Account

    // Populate references
    await purchaseInvoice.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'purchase_order_id', select: 'order_number' },
      { path: 'created_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseInvoice,
      message: `Payment of ${amount} recorded successfully`,
    })
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record payment' },
      { status: 500 }
    )
  }
}
