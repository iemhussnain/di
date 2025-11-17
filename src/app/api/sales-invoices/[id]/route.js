/**
 * Sales Invoice API Route - Single Invoice
 * GET: Get sales invoice by ID
 * PUT: Update sales invoice
 * DELETE: Delete sales invoice
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import SalesInvoice from '@/lib/models/SalesInvoice'
import { updateSalesInvoiceSchema } from '@/lib/validation/salesInvoice'

/**
 * GET /api/sales-invoices/[id]
 * Get single sales invoice
 */
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const salesInvoice = await SalesInvoice.findById(params.id)
      .populate('customer_id', 'customer_code customer_name phone email address ntn strn')
      .populate('sales_order_id', 'order_no order_date')
      .populate('lines.item_id', 'item_code item_name unit_of_measure')
      .populate('created_by', 'name email')
      .populate('posted_by', 'name email')
      .populate('journal_entry_id', 'entry_no entry_date')

    if (!salesInvoice) {
      return NextResponse.json(
        { success: false, error: 'Sales invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: salesInvoice,
    })
  } catch (error) {
    console.error('GET /api/sales-invoices/[id] error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales invoice' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sales-invoices/[id]
 * Update sales invoice
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = updateSalesInvoiceSchema.parse(body)

    // Find sales invoice
    const salesInvoice = await SalesInvoice.findById(params.id)

    if (!salesInvoice) {
      return NextResponse.json(
        { success: false, error: 'Sales invoice not found' },
        { status: 404 }
      )
    }

    // Check if editable
    if (!salesInvoice.is_editable) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot edit posted invoice. Only Draft invoices can be edited.',
        },
        { status: 400 }
      )
    }

    // Update fields
    Object.keys(validatedData).forEach((key) => {
      salesInvoice[key] = validatedData[key]
    })

    await salesInvoice.save()

    return NextResponse.json({
      success: true,
      message: 'Sales invoice updated successfully',
      data: salesInvoice,
    })
  } catch (error) {
    console.error('PUT /api/sales-invoices/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update sales invoice' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sales-invoices/[id]
 * Delete sales invoice
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const salesInvoice = await SalesInvoice.findById(params.id)

    if (!salesInvoice) {
      return NextResponse.json(
        { success: false, error: 'Sales invoice not found' },
        { status: 404 }
      )
    }

    // Only Draft invoices can be deleted
    if (salesInvoice.status !== 'Draft' || salesInvoice.posted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete posted invoice. Only Draft invoices can be deleted.',
        },
        { status: 400 }
      )
    }

    await SalesInvoice.deleteOne({ _id: params.id })

    return NextResponse.json({
      success: true,
      message: 'Sales invoice deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/sales-invoices/[id] error:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to delete sales invoice' },
      { status: 500 }
    )
  }
}
