import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Attendance from '@/lib/models/Attendance'

/**
 * GET /api/attendance/summary
 * Get attendance summary for an employee
 * Query params: employee_id, from_date, to_date
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
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')

    if (!employee_id || !from_date || !to_date) {
      return NextResponse.json(
        { error: 'Please provide employee_id, from_date, and to_date' },
        { status: 400 }
      )
    }

    // Get attendance summary
    const summary = await Attendance.getAttendanceSummary(employee_id, from_date, to_date)

    return NextResponse.json({
      success: true,
      data: summary,
    })
  } catch (error) {
    console.error('Error fetching attendance summary:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance summary' },
      { status: 500 }
    )
  }
}
