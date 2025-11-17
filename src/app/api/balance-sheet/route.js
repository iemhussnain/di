/**
 * Balance Sheet API Route
 * Get balance sheet report
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import {
  getBalanceSheet,
  getComparativeBalanceSheet,
  getFinancialRatios,
} from '@/lib/accounting/financial-statements'
import { z } from 'zod'

// Query parameters validation
const balanceSheetQuerySchema = z.object({
  asOfDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  comparative: z.enum(['true', 'false']).optional().default('false'),
  previousDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  includeRatios: z.enum(['true', 'false']).optional().default('false'),
})

/**
 * GET /api/balance-sheet
 * Get balance sheet report
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = balanceSheetQuerySchema.parse(query)

    // Set default date to today if not provided
    const asOfDate = validatedQuery.asOfDate ? new Date(validatedQuery.asOfDate) : new Date()

    // Comparative mode
    if (validatedQuery.comparative === 'true') {
      if (!validatedQuery.previousDate) {
        return NextResponse.json(
          { success: false, error: 'Previous date is required for comparative balance sheet' },
          { status: 400 }
        )
      }

      const previousDate = new Date(validatedQuery.previousDate)
      const comparativeData = await getComparativeBalanceSheet(asOfDate, previousDate)

      return NextResponse.json({
        success: true,
        data: comparativeData,
      })
    }

    // Get balance sheet
    const balanceSheetData = await getBalanceSheet(asOfDate)

    // Include financial ratios if requested
    if (validatedQuery.includeRatios === 'true') {
      const ratios = await getFinancialRatios(asOfDate)
      balanceSheetData.ratios = ratios
    }

    return NextResponse.json({
      success: true,
      data: balanceSheetData,
    })
  } catch (error) {
    console.error('GET /api/balance-sheet error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate balance sheet' },
      { status: 500 }
    )
  }
}
