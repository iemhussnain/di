/**
 * Trial Balance API Route
 * Get trial balance report
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { getTrialBalance, getGroupedTrialBalance, validateTrialBalance } from '@/lib/accounting/trial-balance'
import { z } from 'zod'

// Query parameters validation
const trialBalanceQuerySchema = z.object({
  asOfDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  grouped: z.enum(['true', 'false']).optional().default('false'),
  validate: z.enum(['true', 'false']).optional().default('false'),
})

/**
 * GET /api/trial-balance
 * Get trial balance report
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = trialBalanceQuerySchema.parse(query)

    // Set default date to today if not provided
    const asOfDate = validatedQuery.asOfDate
      ? new Date(validatedQuery.asOfDate)
      : new Date()

    // If validation is requested
    if (validatedQuery.validate === 'true') {
      const validation = await validateTrialBalance(asOfDate)
      return NextResponse.json({
        success: true,
        data: validation,
      })
    }

    // Get trial balance data
    let trialBalanceData

    if (validatedQuery.grouped === 'true') {
      trialBalanceData = await getGroupedTrialBalance(asOfDate)
    } else {
      trialBalanceData = await getTrialBalance(asOfDate)
    }

    return NextResponse.json({
      success: true,
      data: trialBalanceData,
    })
  } catch (error) {
    console.error('GET /api/trial-balance error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate trial balance' },
      { status: 500 }
    )
  }
}
