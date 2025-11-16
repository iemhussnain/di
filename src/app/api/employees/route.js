/**
 * Employees API Routes
 * Handles employee listing and creation
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import Employee from '@/lib/models/Employee'
import { createEmployeeSchema, employeeQuerySchema } from '@/lib/validation/employee'

/**
 * GET /api/employees
 * List employees with pagination, search, and filters
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = employeeQuerySchema.parse(query)
    const { page, limit, search, status, employment_type, department_id, sort_by, order } =
      validatedQuery

    // Build filter
    const filter = {}

    // Status filter
    if (status && status !== 'all') {
      filter.status = status
    }

    // Employment type filter
    if (employment_type && employment_type !== 'all') {
      filter.employment_type = employment_type
    }

    // Department filter
    if (department_id) {
      filter.department_id = department_id
    }

    // Search filter
    if (search) {
      filter.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { employee_code: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build sort object
    const sort = { [sort_by]: order === 'asc' ? 1 : -1 }

    // Execute query
    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('department_id', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/employees error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/employees
 * Create a new employee
 */
export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = createEmployeeSchema.parse(body)

    // Check for duplicate CNIC
    const existingEmployee = await Employee.findOne({ cnic: validatedData.cnic })

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee with this CNIC already exists' },
        { status: 409 }
      )
    }

    // Create employee
    const employee = await Employee.create(validatedData)

    // Populate department if exists
    if (employee.department_id) {
      await employee.populate('department_id', 'name')
    }

    return NextResponse.json(
      {
        success: true,
        data: employee,
        message: 'Employee created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/employees error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      // Handle duplicate key error
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json(
        { success: false, error: `Employee with this ${field} already exists` },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create employee' },
      { status: 500 }
    )
  }
}
