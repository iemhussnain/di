/**
 * Accounts by Type API Route
 * GET /api/accounts/by-type/:type - Get accounts filtered by type
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Account from '@/lib/models/Account'
import { accountTypeSchema } from '@/lib/validation/account'
import { z } from 'zod'

// GET /api/accounts/by-type/:type
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { type } = params

    // Validate account type
    try {
      accountTypeSchema.parse(type)
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid account type. Must be: Asset, Liability, Equity, Revenue, or Expense',
        },
        { status: 400 }
      )
    }

    const { searchParams } = new URL(request.url)
    const headerOnly = searchParams.get('header_only') === 'true'
    const activeOnly = searchParams.get('active_only') !== 'false' // Default true
    const includeBalance = searchParams.get('include_balance') === 'true'

    // Build filter
    const filter = {
      account_type: type,
    }

    if (headerOnly) {
      filter.is_header = true
    }

    if (activeOnly) {
      filter.is_active = true
    }

    // Build projection
    const projection = includeBalance
      ? {}
      : {
          opening_balance: 0,
          current_balance: 0,
        }

    const accounts = await Account.find(filter, projection)
      .populate('parent_id', 'account_code account_name')
      .sort({ account_code: 1 })

    return NextResponse.json({
      success: true,
      data: accounts,
      count: accounts.length,
    })
  } catch (error) {
    console.error('GET /api/accounts/by-type/:type error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch accounts by type',
      },
      { status: 500 }
    )
  }
}
