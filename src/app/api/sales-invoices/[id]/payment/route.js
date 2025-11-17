/**
 * Sales Invoice Payment API Route
 * POST: Record payment for invoice
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import SalesInvoice from '@/lib/models/SalesInvoice'
import { recordPaymentSchema } from '@/lib/validation/salesInvoice'

/**
 * POST /api/sales-invoices/[id]/payment
 * Record payment against invoice
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = recordPaymentSchema.parse(body)

    // Find invoice
    const invoice = await SalesInvoice.findById(params.id)

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Sales invoice not found' },
        { status: 404 }
      )
    }

    // Record payment
    await invoice.recordPayment(validatedData.amount)

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: invoice,
    })
  } catch (error) {
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
  }
}
