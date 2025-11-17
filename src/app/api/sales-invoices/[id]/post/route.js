/**
 * Sales Invoice Post API Route
 * POST: Post sales invoice and create journal entry
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { postSalesInvoice } from '@/lib/sales/salesInvoice'
import { postSalesInvoiceSchema } from '@/lib/validation/salesInvoice'

/**
 * POST /api/sales-invoices/[id]/post
 * Post sales invoice to accounting
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = postSalesInvoiceSchema.parse(body)

    // Post invoice
    const result = await postSalesInvoice(params.id, validatedData.posted_by)

    return NextResponse.json({
      success: true,
      message: 'Sales invoice posted successfully',
      data: {
        invoice: result.invoice,
        journal_entry: result.journalEntry,
      },
    })
  } catch (error) {
    console.error('POST /api/sales-invoices/[id]/post error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post sales invoice' },
      { status: 500 }
    )
  }
}
