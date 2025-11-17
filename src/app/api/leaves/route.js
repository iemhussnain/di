import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Leave from '@/lib/models/Leave'

/**
 * GET /api/leaves
 * List leave applications with filters
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
    const leave_type = searchParams.get('leave_type')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Build query
    const query = {}
    if (employee_id) query.employee_id = employee_id
    if (status) query.status = status
    if (leave_type) query.leave_type = leave_type
    if (from_date || to_date) {
      query.from_date = {}
      if (from_date) query.from_date.$gte = new Date(from_date)
      if (to_date) query.from_date.$lte = new Date(to_date)
    }

    // Execute query with pagination
    const skip = (page - 1) * limit
    const [leaves, total] = await Promise.all([
      Leave.find(query)
        .populate('employee_id', 'name employee_code department')
        .populate('applied_by', 'name')
        .populate('approved_by', 'name')
        .sort({ from_date: -1, applied_date: -1 })
        .limit(limit)
        .skip(skip),
      Leave.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: leaves,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching leaves:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaves' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/leaves
 * Apply for leave
 */
export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()

    // Create leave application
    const leave = await Leave.create({
      ...body,
      applied_by: token.id,
    })

    // Populate references
    await leave.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'applied_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: leave,
      message: 'Leave application submitted successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating leave application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create leave application' },
      { status: 500 }
    )
  }
}
