/**
 * Registered Customers API Route
 * GET /api/customers/registered - Get only registered customers
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Customer from '@/lib/models/Customer'
import { errorHandler } from '@/lib/errors/errorHandler'

// GET /api/customers/registered
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'Active'

    const customers = await Customer.find({
      is_registered: true,
      status: status,
    })
      .sort({ customer_name: 1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: customers,
      count: customers.length,
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}
