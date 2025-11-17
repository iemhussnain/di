/**
 * Payment Cancel API Route
 * POST: Cancel payment
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import Payment from '@/lib/models/Payment'
import { cancelPaymentSchema } from '@/lib/validation/payment'

/**
 * POST /api/payments/[id]/cancel
 * Cancel payment
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = cancelPaymentSchema.parse(body)

    // Find payment
    const payment = await Payment.findById(params.id)

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment not found' }, { status: 404 })
    }

    // Cancel payment
    await payment.cancelPayment(validatedData.cancelled_by, validatedData.cancellation_reason)

    return NextResponse.json({
      success: true,
      message: 'Payment cancelled successfully',
      data: payment,
    })
  } catch (error) {
    console.error('POST /api/payments/[id]/cancel error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel payment' },
      { status: 500 }
    )
  }
}
