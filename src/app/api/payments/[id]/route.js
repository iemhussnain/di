/**
 * Payment API Route - Single Payment
 * GET: Get payment by ID
 * PUT: Update payment
 * DELETE: Delete payment
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import Payment from '@/lib/models/Payment'
import { updatePaymentSchema } from '@/lib/validation/payment'

/**
 * GET /api/payments/[id]
 * Get single payment
 */
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const payment = await Payment.findById(params.id)
      .populate('party_id')
      .populate('account_id', 'account_code account_name account_type')
      .populate('invoice_id')
      .populate('created_by', 'name email')
      .populate('posted_by', 'name email')
      .populate('journal_entry_id', 'entry_no entry_date')

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: payment,
    })
  } catch (error) {
    console.error('GET /api/payments/[id] error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/payments/[id]
 * Update payment
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = updatePaymentSchema.parse(body)

    // Find payment
    const payment = await Payment.findById(params.id)

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    // Check if editable
    if (!payment.is_editable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot edit posted payment. Only Draft payments can be edited.',
        },
        { status: 400 }
      )
    }

    // Update fields
    Object.keys(validatedData).forEach((key) => {
      payment[key] = validatedData[key]
    })

    await payment.save()

    return NextResponse.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment,
    })
  } catch (error) {
    console.error('PUT /api/payments/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update payment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/payments/[id]
 * Delete payment
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const payment = await Payment.findById(params.id)

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    // Only Draft payments can be deleted
    if (payment.status !== 'Draft' || payment.posted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete posted payment. Only Draft payments can be deleted.',
        },
        { status: 400 }
      )
    }

    await Payment.deleteOne({ _id: params.id })

    return NextResponse.json({
      success: true,
      message: 'Payment deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/payments/[id] error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to delete payment' },
      { status: 500 }
    )
  }
}
