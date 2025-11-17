import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Payroll from '@/lib/models/Payroll'

/**
 * GET /api/payroll/employee-history
 * Get payroll history for a specific employee
 * Query params: employee_id, limit (default 12)
 */
export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const employee_id = searchParams.get('employee_id')
    const limit = parseInt(searchParams.get('limit') || '12')

    if (!employee_id) {
      return NextResponse.json(
        { error: 'Please provide employee_id' },
        { status: 400 }
      )
    }

    // Get payroll history
    const payrollHistory = await Payroll.getEmployeePayrollHistory(employee_id, limit)

    // Calculate statistics
    const stats = {
      total_records: payrollHistory.length,
      average_gross_salary: payrollHistory.length > 0
        ? payrollHistory.reduce((sum, p) => sum + p.gross_salary, 0) / payrollHistory.length
        : 0,
      average_net_salary: payrollHistory.length > 0
        ? payrollHistory.reduce((sum, p) => sum + p.net_salary, 0) / payrollHistory.length
        : 0,
      total_paid: payrollHistory.reduce((sum, p) =>
        p.status === 'Paid' ? sum + p.net_salary : sum, 0
      ),
    }

    return NextResponse.json({
      success: true,
      data: payrollHistory,
      stats,
    })
  } catch (error) {
    console.error('Error fetching employee payroll history:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employee payroll history' },
      { status: 500 }
    )
  }
}
