import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Payroll from '@/lib/models/Payroll'
import Attendance from '@/lib/models/Attendance'

/**
 * POST /api/payroll/generate
 * Generate payroll from attendance data
 */
export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (token.role !== 'Admin' && token.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to generate payroll' },
        { status: 403 }
      )
    }

    await dbConnect()

    const body = await req.json()
    const { employee_id, month, year, working_days } = body

    if (!employee_id || !month || !year || !working_days) {
      return NextResponse.json(
        { error: 'Please provide employee_id, month, year, and working_days' },
        { status: 400 }
      )
    }

    // Get attendance summary for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const attendanceSummary = await Attendance.getAttendanceSummary(
      employee_id,
      startDate.toISOString(),
      endDate.toISOString()
    )

    // Prepare attendance data
    const attendanceData = {
      working_days,
      present_days: attendanceSummary.present,
      absent_days: attendanceSummary.absent,
      leaves_taken: attendanceSummary.on_leave,
      late_days: attendanceSummary.late,
      overtime_hours: attendanceSummary.total_overtime,
    }

    // Generate payroll
    const payroll = await Payroll.generatePayroll(
      employee_id,
      month,
      year,
      attendanceData,
      token.id
    )

    // Populate references
    await payroll.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'created_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: payroll,
      attendance_summary: attendanceSummary,
      message: 'Payroll generated successfully from attendance data',
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating payroll:', error)

    // Handle duplicate payroll error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Payroll already exists for this employee for the specified month and year' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate payroll' },
      { status: 500 }
    )
  }
}
