import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseOrder from '@/lib/models/PurchaseOrder'
import PurchaseInvoice from '@/lib/models/PurchaseInvoice'

/**
 * POST /api/purchase-orders/[id]/create-bill
 * Create a purchase invoice/bill from purchase order
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()
    const { invoice_number, invoice_date, due_date } = body

    if (!invoice_number || !invoice_date || !due_date) {
      return NextResponse.json(
        { error: 'Please provide invoice number, invoice date, and due date' },
        { status: 400 }
      )
    }

    const purchaseOrder = await PurchaseOrder.findById(params.id)
      .populate('vendor_id')

    if (!purchaseOrder) {
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Check if PO is received
    if (purchaseOrder.status !== 'Received' && purchaseOrder.status !== 'Partially Received') {
      return NextResponse.json(
        { error: 'Purchase order must be received before creating a bill' },
        { status: 400 }
      )
    }

    // Generate internal bill number
    const billNumber = await PurchaseInvoice.generateInvoiceNumber()

    // Create purchase invoice from PO
    const purchaseInvoice = await PurchaseInvoice.create({
      invoice_number: billNumber,
      vendor_invoice_number: invoice_number,
      invoice_date: new Date(invoice_date),
      due_date: new Date(due_date),
      vendor_id: purchaseOrder.vendor_id._id,
      vendor_name: purchaseOrder.vendor_id.name,
      purchase_order_id: purchaseOrder._id,
      purchase_order_number: purchaseOrder.order_number,
      items: purchaseOrder.items,
      subtotal: purchaseOrder.subtotal,
      tax_amount: purchaseOrder.tax_amount,
      total_amount: purchaseOrder.total_amount,
      notes: `Bill created from PO ${purchaseOrder.order_number}`,
      created_by: token.id,
    })

    // Mark PO as bill created
    purchaseOrder.bills_created = true
    await purchaseOrder.save()

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
    console.error('Error creating bill from purchase order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create bill from purchase order' },
      { status: 500 }
    )
  }
}
