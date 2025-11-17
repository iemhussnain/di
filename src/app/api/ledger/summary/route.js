/**
 * Ledger Summary API Route
 * Get summary of all account ledgers
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { getLedgerSummary } from '@/lib/accounting/journal'
import { z } from 'zod'

// Query parameters validation
const summaryQuerySchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  showZeroBalances: z.enum(['true', 'false']).optional().default('false'),
})

/**
 * GET /api/ledger/summary
 * Get ledger summary for all accounts
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = summaryQuerySchema.parse(query)

    // Set default date range if not provided
    const startDate = validatedQuery.startDate
      ? new Date(validatedQuery.startDate)
      : new Date(new Date().getFullYear(), 0, 1) // Jan 1 of current year

    const endDate = validatedQuery.endDate
      ? new Date(validatedQuery.endDate)
      : new Date() // Today

    // Get summary data
    const summary = await getLedgerSummary(startDate, endDate, {
      showZeroBalances: validatedQuery.showZeroBalances === 'true',
    })

    // Calculate totals
    const totals = summary.reduce(
      (acc, account) => {
        acc.total_debits += account.total_debits
        acc.total_credits += account.total_credits
        acc.total_opening += account.opening_balance
        acc.total_closing += account.closing_balance
        return acc
      },
      {
        total_debits: 0,
        total_credits: 0,
        total_opening: 0,
        total_closing: 0,
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        start_date: startDate,
        end_date: endDate,
        accounts: summary,
        totals: {
          total_debits: Math.round(totals.total_debits * 100) / 100,
          total_credits: Math.round(totals.total_credits * 100) / 100,
          total_opening_balance: Math.round(totals.total_opening * 100) / 100,
          total_closing_balance: Math.round(totals.total_closing * 100) / 100,
        },
      },
    })
  } catch (error) {
    console.error('GET /api/ledger/summary error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch ledger summary' },
      { status: 500 }
    )
  }
}
