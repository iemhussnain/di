/**
 * Sales Invoice Cancel API Route
 * POST: Cancel sales invoice
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import SalesInvoice from '@/lib/models/SalesInvoice'
import { cancelSalesInvoiceSchema } from '@/lib/validation/salesInvoice'

/**
 * POST /api/sales-invoices/[id]/cancel
 * Cancel sales invoice
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = cancelSalesInvoiceSchema.parse(body)

    // Find invoice
    const invoice = await SalesInvoice.findById(params.id)

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Sales invoice not found' },
        { status: 404 }
      )
    }

    // Cancel invoice
    await invoice.cancelInvoice(validatedData.cancelled_by, validatedData.cancellation_reason)

    return NextResponse.json({
      success: true,
      message: 'Sales invoice cancelled successfully',
      data: invoice,
    })
  } catch (error) {
    console.error('POST /api/sales-invoices/[id]/cancel error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel sales invoice' },
      { status: 500 }
    )
  }
}
