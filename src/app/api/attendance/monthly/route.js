import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Attendance from '@/lib/models/Attendance'

/**
 * GET /api/attendance/monthly
 * Get monthly attendance for an employee
 * Query params: employee_id, year, month
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
    const year = parseInt(searchParams.get('year'))
    const month = parseInt(searchParams.get('month'))

    if (!employee_id || !year || !month) {
      return NextResponse.json(
        { error: 'Please provide employee_id, year, and month' },
        { status: 400 }
      )
    }

    // Get monthly attendance
    const attendance = await Attendance.getMonthlyAttendance(employee_id, year, month)

    return NextResponse.json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    console.error('Error fetching monthly attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch monthly attendance' },
      { status: 500 }
    )
  }
}
