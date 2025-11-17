/**
 * Sales Invoices API Route
 * GET: List sales invoices
 * POST: Create new sales invoice
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import SalesInvoice from '@/lib/models/SalesInvoice'
import { createSalesInvoice } from '@/lib/sales/salesInvoice'
import { createSalesInvoiceSchema, salesInvoiceQuerySchema } from '@/lib/validation/salesInvoice'

/**
 * GET /api/sales-invoices
 * List sales invoices with filters and pagination
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = salesInvoiceQuerySchema.parse(query)

    // Build filter
    const filter = {}

    if (validatedQuery.customer_id) {
      filter.customer_id = validatedQuery.customer_id
    }

    if (validatedQuery.status) {
      filter.status = validatedQuery.status
    }

    if (validatedQuery.posted !== undefined) {
      filter.posted = validatedQuery.posted
    }

    if (validatedQuery.start_date || validatedQuery.end_date) {
      filter.invoice_date = {}
      if (validatedQuery.start_date) {
        filter.invoice_date.$gte = new Date(validatedQuery.start_date)
      }
      if (validatedQuery.end_date) {
        filter.invoice_date.$lte = new Date(validatedQuery.end_date)
      }
    }

    // Overdue filter
    if (validatedQuery.overdue === true) {
      filter.posted = true
      filter.status = { $in: ['Posted', 'Partially Paid', 'Overdue'] }
      filter.due_date = { $lt: new Date() }
      filter.amount_due = { $gt: 0 }
    }

    if (validatedQuery.search) {
      filter.$or = [
        { invoice_no: { $regex: validatedQuery.search, $options: 'i' } },
        { customer_name: { $regex: validatedQuery.search, $options: 'i' } },
        { sales_order_no: { $regex: validatedQuery.search, $options: 'i' } },
      ]
    }

    // Pagination
    const page = validatedQuery.page || 1
    const limit = validatedQuery.limit || 20
    const skip = (page - 1) * limit

    // Execute query
    const [invoices, totalCount] = await Promise.all([
      SalesInvoice.find(filter)
        .populate('customer_id', 'customer_code customer_name')
        .populate('sales_order_id', 'order_no')
        .populate('lines.item_id', 'item_code item_name')
        .sort({ invoice_date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SalesInvoice.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/sales-invoices error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales invoices' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sales-invoices
 * Create new sales invoice
 */
export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = createSalesInvoiceSchema.parse(body)

    // Create sales invoice
    const salesInvoice = await createSalesInvoice(validatedData)

    return NextResponse.json(
      {
        success: true,
        message: 'Sales invoice created successfully',
        data: salesInvoice,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/sales-invoices error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create sales invoice' },
      { status: 500 }
    )
  }
}
