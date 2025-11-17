import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Leave from '@/lib/models/Leave'
import Attendance from '@/lib/models/Attendance'

/**
 * POST /api/leaves/[id]/approve
 * Approve a leave application
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has approval permission
    if (token.role !== 'Admin' && token.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve leave applications' },
        { status: 403 }
      )
    }

    await dbConnect()

    const leave = await Leave.findById(params.id)

    if (!leave) {
      return NextResponse.json(
        { error: 'Leave application not found' },
        { status: 404 }
      )
    }

    // Approve the leave
    await leave.approve(token.id)

    // Create attendance records for leave period
    const startDate = new Date(leave.from_date)
    const endDate = new Date(leave.to_date)
    const attendanceRecords = []

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      try {
        const attendance = await Attendance.create({
          employee_id: leave.employee_id,
          employee_name: leave.employee_name,
          employee_code: leave.employee_code,
          date: new Date(date),
          status: 'On Leave',
          leave_id: leave._id,
          marked_by: token.id,
        })
        attendanceRecords.push(attendance)
      } catch (error) {
        // Skip if attendance already exists for this date
        if (error.code !== 11000) {
          console.error('Error creating attendance record:', error)
        }
      }
    }

    // Populate references
    await leave.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'applied_by', select: 'name' },
      { path: 'approved_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: leave,
      message: 'Leave application approved successfully',
      attendance_records_created: attendanceRecords.length,
    })
  } catch (error) {
    console.error('Error approving leave application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve leave application' },
      { status: 500 }
    )
  }
}
