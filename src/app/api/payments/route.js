/**
 * Payments API Route
 * GET: List payments
 * POST: Create new payment
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import Payment from '@/lib/models/Payment'
import { createPayment } from '@/lib/sales/payment'
import { createPaymentSchema, paymentQuerySchema } from '@/lib/validation/payment'

/**
 * GET /api/payments
 * List payments with filters and pagination
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = paymentQuerySchema.parse(query)

    // Build filter
    const filter = {}

    if (validatedQuery.payment_type) {
      filter.payment_type = validatedQuery.payment_type
    }

    if (validatedQuery.party_type) {
      filter.party_type = validatedQuery.party_type
    }

    if (validatedQuery.party_id) {
      filter.party_id = validatedQuery.party_id
    }

    if (validatedQuery.status) {
      filter.status = validatedQuery.status
    }

    if (validatedQuery.posted !== undefined) {
      filter.posted = validatedQuery.posted
    }

    if (validatedQuery.start_date || validatedQuery.end_date) {
      filter.payment_date = {}
      if (validatedQuery.start_date) {
        filter.payment_date.$gte = new Date(validatedQuery.start_date)
      }
      if (validatedQuery.end_date) {
        filter.payment_date.$lte = new Date(validatedQuery.end_date)
      }
    }

    if (validatedQuery.search) {
      filter.$or = [
        { payment_no: { $regex: validatedQuery.search, $options: 'i' } },
        { party_name: { $regex: validatedQuery.search, $options: 'i' } },
        { invoice_no: { $regex: validatedQuery.search, $options: 'i' } },
        { transaction_ref: { $regex: validatedQuery.search, $options: 'i' } },
      ]
    }

    // Pagination
    const page = validatedQuery.page || 1
    const limit = validatedQuery.limit || 20
    const skip = (page - 1) * limit

    // Execute query
    const [payments, totalCount] = await Promise.all([
      Payment.find(filter)
        .populate('party_id')
        .populate('account_id', 'account_code account_name')
        .populate('invoice_id')
        .sort({ payment_date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/payments error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payments
 * Create new payment
 */
export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = createPaymentSchema.parse(body)

    // Create payment
    const payment = await createPayment(validatedData)

    return NextResponse.json(
      {
        success: true,
        message: 'Payment created successfully',
        data: payment,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/payments error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
