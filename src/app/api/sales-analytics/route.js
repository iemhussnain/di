/**
 * Sales Analytics API Route
 * GET: Get sales analytics and reports
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import {
  getSalesOrderSummary,
  getTopSellingItems,
  getTopCustomers,
  getSalesByPeriod,
} from '@/lib/sales/salesOrder'
import {
  getRevenueSummary,
  getAgingReport,
  getCustomerStatement,
} from '@/lib/sales/salesInvoice'
import { getPaymentSummary, getCashflowSummary } from '@/lib/sales/payment'
import { z } from 'zod'

// Query parameters validation
const analyticsQuerySchema = z.object({
  report_type: z.enum([
    'sales_summary',
    'revenue_summary',
    'top_items',
    'top_customers',
    'sales_by_period',
    'aging_report',
    'customer_statement',
    'payment_summary',
    'cashflow_summary',
  ]),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date'),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date'),
  period: z.enum(['day', 'week', 'month']).optional(),
  customer_id: z.string().optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
})

/**
 * GET /api/sales-analytics
 * Get various sales analytics reports
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = analyticsQuerySchema.parse(query)

    const startDate = new Date(validatedQuery.start_date)
    const endDate = new Date(validatedQuery.end_date)

    let data

    switch (validatedQuery.report_type) {
      case 'sales_summary':
        data = await getSalesOrderSummary(startDate, endDate)
        break

      case 'revenue_summary':
        data = await getRevenueSummary(startDate, endDate)
        break

      case 'top_items':
        data = await getTopSellingItems(startDate, endDate, validatedQuery.limit || 10)
        break

      case 'top_customers':
        data = await getTopCustomers(startDate, endDate, validatedQuery.limit || 10)
        break

      case 'sales_by_period':
        data = await getSalesByPeriod(startDate, endDate, validatedQuery.period || 'day')
        break

      case 'aging_report':
        data = await getAgingReport()
        break

      case 'customer_statement':
        if (!validatedQuery.customer_id) {
          return NextResponse.json(
            { success: false, error: 'customer_id is required for customer statement' },
            { status: 400 }
          )
        }
        data = await getCustomerStatement(validatedQuery.customer_id, startDate, endDate)
        break

      case 'payment_summary':
        data = await getPaymentSummary(startDate, endDate)
        break

      case 'cashflow_summary':
        data = await getCashflowSummary(startDate, endDate)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid report type' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      report_type: validatedQuery.report_type,
      period: { start_date: startDate, end_date: endDate },
      data,
    })
  } catch (error) {
    console.error('GET /api/sales-analytics error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate analytics report' },
      { status: 500 }
    )
  }
}
