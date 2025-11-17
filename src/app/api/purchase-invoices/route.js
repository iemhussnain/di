import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseInvoice from '@/lib/models/PurchaseInvoice'

/**
 * GET /api/purchase-invoices
 * List all purchase invoices/bills with filters
 */
export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const payment_status = searchParams.get('payment_status')
    const vendor_id = searchParams.get('vendor_id')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')
    const overdue = searchParams.get('overdue') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Build query
    const query = {}
    if (status) query.status = status
    if (payment_status) query.payment_status = payment_status
    if (vendor_id) query.vendor_id = vendor_id
    if (from_date || to_date) {
      query.invoice_date = {}
      if (from_date) query.invoice_date.$gte = new Date(from_date)
      if (to_date) query.invoice_date.$lte = new Date(to_date)
    }
    if (overdue) {
      query.status = 'Posted'
      query.payment_status = { $in: ['Unpaid', 'Partially Paid', 'Overdue'] }
      query.due_date = { $lt: new Date() }
    }

    // Execute query with pagination
    const skip = (page - 1) * limit
    const [invoices, total] = await Promise.all([
      PurchaseInvoice.find(query)
        .populate('vendor_id', 'name vendor_code')
        .populate('purchase_order_id', 'order_number')
        .populate('created_by', 'name')
        .sort({ invoice_date: -1, invoice_number: -1 })
        .limit(limit)
        .skip(skip),
      PurchaseInvoice.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching purchase invoices:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase invoices' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/purchase-invoices
 * Create a new purchase invoice/bill (direct, not from PO)
 */
export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()

    // Generate internal invoice number
    const invoiceNumber = await PurchaseInvoice.generateInvoiceNumber()

    // Create purchase invoice
    const purchaseInvoice = await PurchaseInvoice.create({
      ...body,
      invoice_number: invoiceNumber,
      created_by: token.id,
    })

    // Populate references
    await purchaseInvoice.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'purchase_order_id', select: 'order_number' },
      { path: 'created_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseInvoice,
      message: 'Purchase invoice created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create purchase invoice' },
      { status: 500 }
    )
  }
}
