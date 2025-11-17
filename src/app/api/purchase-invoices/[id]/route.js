import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseInvoice from '@/lib/models/PurchaseInvoice'

/**
 * GET /api/purchase-invoices/[id]
 * Get a single purchase invoice
 */
export async function GET(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const purchaseInvoice = await PurchaseInvoice.findById(params.id)
      .populate('vendor_id', 'name vendor_code email phone address')
      .populate('purchase_order_id', 'order_number order_date')
      .populate('created_by', 'name email')
      .populate('journal_entry_id')

    if (!purchaseInvoice) {
      return NextResponse.json(
        { error: 'Purchase invoice not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: purchaseInvoice,
    })
  } catch (error) {
    console.error('Error fetching purchase invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase invoice' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/purchase-invoices/[id]
 * Update a purchase invoice
 */
export async function PUT(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()

    const purchaseInvoice = await PurchaseInvoice.findById(params.id)

    if (!purchaseInvoice) {
      return NextResponse.json(
        { error: 'Purchase invoice not found' },
        { status: 404 }
      )
    }

    // Check if editable
    if (!purchaseInvoice.is_editable) {
      return NextResponse.json(
        { error: 'Cannot edit posted or cancelled invoice' },
        { status: 400 }
      )
    }

    // Update fields
    Object.assign(purchaseInvoice, body)
    await purchaseInvoice.save()

    // Populate references
    await purchaseInvoice.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'purchase_order_id', select: 'order_number' },
      { path: 'created_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseInvoice,
      message: 'Purchase invoice updated successfully',
    })
  } catch (error) {
    console.error('Error updating purchase invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update purchase invoice' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/purchase-invoices/[id]
 * Delete a purchase invoice (only if in Draft status)
 */
export async function DELETE(req, { params }) {
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

    // Only allow deletion if in Draft status
    if (purchaseInvoice.status !== 'Draft') {
      return NextResponse.json(
        { error: 'Can only delete invoices in Draft status' },
        { status: 400 }
      )
    }

    await purchaseInvoice.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Purchase invoice deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting purchase invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete purchase invoice' },
      { status: 500 }
    )
  }
}
