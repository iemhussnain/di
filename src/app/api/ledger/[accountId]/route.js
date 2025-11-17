/**
 * Account Ledger API Route
 * Get ledger entries for a specific account
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { getAccountLedger } from '@/lib/accounting/journal'
import { z } from 'zod'

// Query parameters validation
const ledgerQuerySchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
})

/**
 * GET /api/ledger/[accountId]
 * Get account ledger with date range filtering
 */
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const { accountId } = params
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate account ID
    if (!accountId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account ID' },
        { status: 400 }
      )
    }

    // Validate query parameters
    const validatedQuery = ledgerQuerySchema.parse(query)

    // Set default date range if not provided
    const startDate = validatedQuery.startDate
      ? new Date(validatedQuery.startDate)
      : new Date(new Date().getFullYear(), 0, 1) // Jan 1 of current year

    const endDate = validatedQuery.endDate
      ? new Date(validatedQuery.endDate)
      : new Date() // Today

    // Get ledger data
    const ledgerData = await getAccountLedger(accountId, startDate, endDate)

    return NextResponse.json({
      success: true,
      data: ledgerData,
    })
  } catch (error) {
    console.error('GET /api/ledger/[accountId] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message === 'Account not found') {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch ledger' },
      { status: 500 }
    )
  }
}
