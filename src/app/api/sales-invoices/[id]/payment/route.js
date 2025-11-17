/**
 * Sales Invoice Payment API Route
 * POST: Record payment for invoice
 * This creates a proper Payment record with journal entry
 */

import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/db/mongodb'
import SalesInvoice from '@/lib/models/SalesInvoice'
import Payment from '@/lib/models/Payment'
import Customer from '@/lib/models/Customer'
import Account from '@/lib/models/Account'
import JournalEntry from '@/lib/models/JournalEntry'
import { recordPaymentSchema } from '@/lib/validation/salesInvoice'

/**
 * POST /api/sales-invoices/[id]/payment
 * Record payment against invoice
 * Creates Payment record, journal entry, and updates customer balance
 */
export async function POST(request, { params }) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = recordPaymentSchema.parse(body)

    // Find invoice
    const invoice = await SalesInvoice.findById(params.id)
      .populate('customer_id', 'customer_code customer_name current_balance')
      .session(session)

    if (!invoice) {
      await session.abortTransaction()
      return NextResponse.json(
        { success: false, error: 'Sales invoice not found' },
        { status: 404 }
      )
    }

    // Validate invoice is posted and has amount due
    if (!invoice.posted) {
      await session.abortTransaction()
      return NextResponse.json(
        { success: false, error: 'Invoice must be posted before recording payment' },
        { status: 400 }
      )
    }

    if (invoice.amount_due <= 0) {
      await session.abortTransaction()
      return NextResponse.json(
        { success: false, error: 'Invoice is already fully paid' },
        { status: 400 }
      )
    }

    if (validatedData.amount > invoice.amount_due) {
      await session.abortTransaction()
      return NextResponse.json(
        { success: false, error: `Payment amount cannot exceed amount due (${invoice.amount_due})` },
        { status: 400 }
      )
    }

    // Verify cash/bank account exists
    const account = await Account.findById(validatedData.account_id).session(session)
    if (!account) {
      await session.abortTransaction()
      return NextResponse.json(
        { success: false, error: 'Cash/Bank account not found' },
        { status: 404 }
      )
    }

    // Create Payment record
    const paymentData = {
      payment_date: validatedData.payment_date
        ? new Date(validatedData.payment_date)
        : new Date(),
      payment_type: 'Receipt',
      party_type: 'Customer',
      party_id: invoice.customer_id._id,
      party_name: invoice.customer_id.customer_name,
      party_code: invoice.customer_id.customer_code,
      amount: validatedData.amount,
      payment_method: validatedData.payment_method,
      account_id: validatedData.account_id,
      invoice_type: 'SalesInvoice',
      invoice_id: invoice._id,
      invoice_no: invoice.invoice_no,
      notes: validatedData.notes,
      created_by: validatedData.created_by,
    }

    // Add optional bank details
    if (validatedData.bank_name) paymentData.bank_name = validatedData.bank_name
    if (validatedData.cheque_no) paymentData.cheque_no = validatedData.cheque_no
    if (validatedData.transaction_ref) paymentData.transaction_ref = validatedData.transaction_ref

    const payment = new Payment(paymentData)
    await payment.save({ session })

    // Post payment immediately (creates journal entry)
    // Find required accounts
    const accountsReceivableAccount = await Account.findOne({
      account_code: '1200',
      account_name: 'Accounts Receivable',
    }).session(session)

    if (!accountsReceivableAccount) {
      await session.abortTransaction()
      return NextResponse.json(
        { success: false, error: 'Accounts Receivable account not found (1200)' },
        { status: 500 }
      )
    }

    // Create journal entry for payment
    const journalEntry = new JournalEntry({
      entry_date: payment.payment_date,
      entry_type: 'Payment',
      reference_type: 'Payment',
      reference_id: payment._id,
      reference_no: payment.payment_no,
      description: `Customer payment from ${invoice.customer_name} for Invoice ${invoice.invoice_no}`,
      lines: [
        {
          account_id: account._id,
          description: `Payment received from ${invoice.customer_name}`,
          debit: validatedData.amount,
          credit: 0,
        },
        {
          account_id: accountsReceivableAccount._id,
          description: `Payment for Invoice ${invoice.invoice_no}`,
          debit: 0,
          credit: validatedData.amount,
        },
      ],
      created_by: validatedData.created_by,
    })

    await journalEntry.save({ session })

    // Update payment with journal entry reference and post it
    payment.journal_entry_id = journalEntry._id
    payment.posted = true
    payment.posted_by = validatedData.created_by
    payment.posted_at = new Date()
    payment.status = 'Posted'
    await payment.save({ session })

    // Update invoice amounts
    await invoice.recordPayment(validatedData.amount)
    await invoice.save({ session })

    // Update customer balance (increase balance = reduce liability)
    const customer = await Customer.findById(invoice.customer_id._id).session(session)
    if (customer) {
      customer.current_balance += validatedData.amount
      customer.last_payment_date = payment.payment_date
      await customer.save({ session })
    }

    await session.commitTransaction()

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        invoice,
        journal_entry: journalEntry,
      },
    })
  } catch (error) {
    await session.abortTransaction()
    console.error('POST /api/sales-invoices/[id]/payment error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to record payment' },
      { status: 500 }
    )
  } finally {
    session.endSession()
  }
}
