import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Attendance from '@/lib/models/Attendance'

/**
 * GET /api/attendance
 * List attendance records with filters
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
    const status = searchParams.get('status')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')
    const limit = parseInt(searchParams.get('limit') || '100')
    const page = parseInt(searchParams.get('page') || '1')

    // Build query
    const query = {}
    if (employee_id) query.employee_id = employee_id
    if (status) query.status = status
    if (from_date || to_date) {
      query.date = {}
      if (from_date) query.date.$gte = new Date(from_date)
      if (to_date) query.date.$lte = new Date(to_date)
    }

    // Execute query with pagination
    const skip = (page - 1) * limit
    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('employee_id', 'name employee_code department')
        .populate('leave_id', 'leave_type')
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip),
      Attendance.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: attendance,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/attendance
 * Mark attendance for an employee
 */
export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()

    // Create or update attendance
    const attendance = await Attendance.create({
      ...body,
      marked_by: token.id,
    })

    // Populate references
    await attendance.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'leave_id', select: 'leave_type' },
    ])

    return NextResponse.json({
      success: true,
      data: attendance,
      message: 'Attendance marked successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error marking attendance:', error)

    // Handle duplicate attendance error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Attendance already marked for this employee on this date' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to mark attendance' },
      { status: 500 }
    )
  }
}
