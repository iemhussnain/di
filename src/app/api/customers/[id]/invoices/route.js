/**
 * Customer Invoices API Route
 * GET /api/customers/:id/invoices - Get customer invoices
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Customer from '@/lib/models/Customer'
import { errorHandler } from '@/lib/errors/errorHandler'
import mongoose from 'mongoose'

// GET /api/customers/:id/invoices
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid customer ID',
        },
        { status: 400 }
      )
    }

    const customer = await Customer.findById(id)

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Customer not found',
        },
        { status: 404 }
      )
    }

    // TODO: Implement invoice retrieval when sales module is implemented
    // For now, return placeholder
    const invoices = {
      customer: {
        id: customer._id,
        code: customer.customer_code,
        name: customer.customer_name,
      },
      invoices: [
        // This will be populated from Invoice model when sales module is implemented
        // {
        //   invoice_number: 'INV-00001',
        //   date: '2025-01-01',
        //   amount: 1000,
        //   paid: 500,
        //   balance: 500,
        //   status: 'Partial',
        // },
      ],
      summary: {
        total_invoices: 0,
        total_amount: 0,
        total_paid: 0,
        total_outstanding: customer.current_balance < 0 ? -customer.current_balance : 0,
      },
    }

    return NextResponse.json({
      success: true,
      data: invoices,
      message: 'Invoice functionality will be available after sales module is implemented',
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}
