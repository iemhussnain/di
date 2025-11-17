import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Leave from '@/lib/models/Leave'

/**
 * GET /api/leaves/balance
 * Get leave balance for an employee
 * Query params: employee_id, year
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear())

    if (!employee_id) {
      return NextResponse.json(
        { error: 'Please provide employee_id' },
        { status: 400 }
      )
    }

    // Get leave balance
    const balance = await Leave.getLeaveBalance(employee_id, year)

    return NextResponse.json({
      success: true,
      data: balance,
      year,
    })
  } catch (error) {
    console.error('Error fetching leave balance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leave balance' },
      { status: 500 }
    )
  }
}
