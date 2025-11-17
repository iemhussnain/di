import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Attendance from '@/lib/models/Attendance'

/**
 * GET /api/attendance/[id]
 * Get a single attendance record
 */
export async function GET(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const attendance = await Attendance.findById(params.id)
      .populate('employee_id', 'name employee_code department')
      .populate('leave_id', 'leave_type from_date to_date')
      .populate('marked_by', 'name')

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: attendance,
    })
  } catch (error) {
    console.error('Error fetching attendance record:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance record' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/attendance/[id]
 * Update an attendance record
 */
export async function PUT(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()

    const attendance = await Attendance.findById(params.id)

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // Update fields
    Object.assign(attendance, body)
    await attendance.save()

    // Populate references
    await attendance.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'leave_id', select: 'leave_type' },
    ])

    return NextResponse.json({
      success: true,
      data: attendance,
      message: 'Attendance record updated successfully',
    })
  } catch (error) {
    console.error('Error updating attendance record:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update attendance record' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/attendance/[id]
 * Delete an attendance record
 */
export async function DELETE(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete attendance records
    if (token.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete attendance records' },
        { status: 403 }
      )
    }

    await dbConnect()

    const attendance = await Attendance.findById(params.id)

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    await attendance.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Attendance record deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting attendance record:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete attendance record' },
      { status: 500 }
    )
  }
}
