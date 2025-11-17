/**
 * Profit & Loss API Route
 * Get profit and loss statement
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { getProfitLoss, getComparativeProfitLoss } from '@/lib/accounting/financial-statements'
import { z } from 'zod'

// Query parameters validation
const profitLossQuerySchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  comparative: z.enum(['true', 'false']).optional().default('false'),
  previousStartDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
  previousEndDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
})

/**
 * GET /api/profit-loss
 * Get profit and loss statement
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = profitLossQuerySchema.parse(query)

    // Set default dates if not provided (current year)
    const endDate = validatedQuery.endDate ? new Date(validatedQuery.endDate) : new Date()
    const startDate = validatedQuery.startDate
      ? new Date(validatedQuery.startDate)
      : new Date(endDate.getFullYear(), 0, 1) // January 1st of current year

    // Comparative mode
    if (validatedQuery.comparative === 'true') {
      if (!validatedQuery.previousStartDate || !validatedQuery.previousEndDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'Previous period dates are required for comparative profit & loss statement',
          },
          { status: 400 }
        )
      }

      const previousStartDate = new Date(validatedQuery.previousStartDate)
      const previousEndDate = new Date(validatedQuery.previousEndDate)

      const comparativeData = await getComparativeProfitLoss(
        startDate,
        endDate,
        previousStartDate,
        previousEndDate
      )

      return NextResponse.json({
        success: true,
        data: comparativeData,
      })
    }

    // Get profit & loss statement
    const profitLossData = await getProfitLoss(startDate, endDate)

    return NextResponse.json({
      success: true,
      data: profitLossData,
    })
  } catch (error) {
    console.error('GET /api/profit-loss error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate profit & loss statement' },
      { status: 500 }
    )
  }
}
