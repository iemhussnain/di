import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Payroll from '@/lib/models/Payroll'

/**
 * GET /api/payroll
 * List payroll records with filters
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
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Build query
    const query = {}
    if (employee_id) query.employee_id = employee_id
    if (status) query.status = status
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)

    // Execute query with pagination
    const skip = (page - 1) * limit
    const [payrolls, total] = await Promise.all([
      Payroll.find(query)
        .populate('employee_id', 'name employee_code department')
        .populate('created_by', 'name')
        .populate('processed_by', 'name')
        .sort({ year: -1, month: -1, employee_code: 1 })
        .limit(limit)
        .skip(skip),
      Payroll.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: payrolls,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching payroll records:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payroll records' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payroll
 * Create a payroll record manually
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
        { error: 'Insufficient permissions to create payroll' },
        { status: 403 }
      )
    }

    await dbConnect()

    const body = await req.json()

    // Create payroll
    const payroll = await Payroll.create({
      ...body,
      created_by: token.id,
    })

    // Populate references
    await payroll.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'created_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: payroll,
      message: 'Payroll record created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll record:', error)

    // Handle duplicate payroll error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Payroll already exists for this employee for the specified month and year' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create payroll record' },
      { status: 500 }
    )
  }
}
