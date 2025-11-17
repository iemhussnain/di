/**
 * Payment Post API Route
 * POST: Post payment and create journal entry
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { postPayment } from '@/lib/sales/payment'
import { postPaymentSchema } from '@/lib/validation/payment'

/**
 * POST /api/payments/[id]/post
 * Post payment to accounting
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = postPaymentSchema.parse(body)

    // Post payment
    const result = await postPayment(params.id, validatedData.posted_by)

    return NextResponse.json({
      success: true,
      message: 'Payment posted successfully',
      data: {
        payment: result.payment,
        journal_entry: result.journalEntry,
      },
    })
  } catch (error) {
    console.error('POST /api/payments/[id]/post error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post payment' },
      { status: 500 }
    )
  }
}
