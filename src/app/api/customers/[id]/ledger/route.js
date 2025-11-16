/**
 * Customer Ledger API Route
 * GET /api/customers/:id/ledger - Get customer ledger (transactions)
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Customer from '@/lib/models/Customer'
import { errorHandler } from '@/lib/errors/errorHandler'
import mongoose from 'mongoose'

// GET /api/customers/:id/ledger
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { id } = params
    const { searchParams } = new URL(request.url)
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')

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

    // TODO: Implement ledger retrieval from journal entries/transactions
    // For now, return placeholder structure
    const ledger = {
      customer: {
        id: customer._id,
        code: customer.customer_code,
        name: customer.customer_name,
      },
      opening_balance: customer.opening_balance,
      current_balance: customer.current_balance,
      transactions: [
        // This will be populated from journal entries when that module is implemented
        // {
        //   date: '2025-01-01',
        //   reference: 'INV-00001',
        //   description: 'Invoice #INV-00001',
        //   debit: 1000,
        //   credit: 0,
        //   balance: 1000,
        // },
      ],
      summary: {
        total_debit: 0,
        total_credit: 0,
        net_balance: customer.current_balance,
      },
    }

    return NextResponse.json({
      success: true,
      data: ledger,
      message: 'Ledger functionality will be available after journal entries module is implemented',
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}
