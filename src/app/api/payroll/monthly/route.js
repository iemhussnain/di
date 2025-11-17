import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Payroll from '@/lib/models/Payroll'

/**
 * GET /api/payroll/monthly
 * Get monthly payroll for all employees
 * Query params: month, year
 */
export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (token.role !== 'Admin' && token.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to view monthly payroll' },
        { status: 403 }
      )
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get('month'))
    const year = parseInt(searchParams.get('year'))

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Please provide month and year' },
        { status: 400 }
      )
    }

    // Get monthly payroll
    const payrolls = await Payroll.getMonthlyPayroll(month, year)

    // Calculate summary
    const summary = {
      total_employees: payrolls.length,
      total_gross_salary: payrolls.reduce((sum, p) => sum + p.gross_salary, 0),
      total_deductions: payrolls.reduce((sum, p) => sum + p.total_deductions, 0),
      total_net_salary: payrolls.reduce((sum, p) => sum + p.net_salary, 0),
      status_breakdown: {
        draft: payrolls.filter(p => p.status === 'Draft').length,
        processed: payrolls.filter(p => p.status === 'Processed').length,
        paid: payrolls.filter(p => p.status === 'Paid').length,
        on_hold: payrolls.filter(p => p.status === 'On Hold').length,
      },
    }

    return NextResponse.json({
      success: true,
      data: payrolls,
      summary,
      month,
      year,
    })
  } catch (error) {
    console.error('Error fetching monthly payroll:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch monthly payroll' },
      { status: 500 }
    )
  }
}
