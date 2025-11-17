/**
 * Create Invoice from Sales Order API Route
 * POST: Create invoice from sales order
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { createInvoiceFromOrder } from '@/lib/sales/salesOrder'
import { createInvoiceFromOrderSchema } from '@/lib/validation/salesInvoice'

/**
 * POST /api/sales-orders/[id]/create-invoice
 * Create invoice from confirmed sales order
 */
export async function POST(request, { params }) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = createInvoiceFromOrderSchema.parse({
      ...body,
      sales_order_id: params.id,
    })

    // Create invoice from order
    const invoice = await createInvoiceFromOrder(params.id, validatedData)

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice created successfully from sales order',
        data: invoice,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/sales-orders/[id]/create-invoice error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create invoice from sales order' },
      { status: 500 }
    )
  }
}
