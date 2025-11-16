/**
 * Individual Employee API Routes
 * Handles single employee operations (get, update, delete)
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import Employee from '@/lib/models/Employee'
import { updateEmployeeSchema, employeeIdSchema } from '@/lib/validation/employee'

/**
 * GET /api/employees/[id]
 * Get a single employee by ID
 */
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const { id } = params

    // Validate employee ID
    employeeIdSchema.parse(id)

    const employee = await Employee.findById(id).populate('department_id', 'name').lean()

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: employee,
    })
  } catch (error) {
    console.error('GET /api/employees/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 })
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid employee ID format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/employees/[id]
 * Update an employee by ID
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const { id } = params
    const body = await request.json()

    // Validate employee ID
    employeeIdSchema.parse(id)

    // Validate request body
    const validatedData = updateEmployeeSchema.parse(body)

    // Check if employee exists
    const employee = await Employee.findById(id)

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    // Check for duplicate CNIC (if CNIC is being updated)
    if (validatedData.cnic && validatedData.cnic !== employee.cnic) {
      const existingEmployee = await Employee.findOne({
        _id: { $ne: id },
        cnic: validatedData.cnic,
      })

      if (existingEmployee) {
        return NextResponse.json(
          { success: false, error: 'Employee with this CNIC already exists' },
          { status: 409 }
        )
      }
    }

    // Update employee
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    ).populate('department_id', 'name')

    return NextResponse.json({
      success: true,
      data: updatedEmployee,
      message: 'Employee updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/employees/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid employee ID format' },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json(
        { success: false, error: `Employee with this ${field} already exists` },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/employees/[id]
 * Soft delete an employee by setting status to Terminated
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const { id } = params

    // Validate employee ID
    employeeIdSchema.parse(id)

    // Check if employee exists
    const employee = await Employee.findById(id)

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    // Soft delete by setting status to Terminated
    employee.status = 'Terminated'
    employee.resignation_date = new Date()
    await employee.save()

    return NextResponse.json({
      success: true,
      message: 'Employee terminated successfully',
    })
  } catch (error) {
    console.error('DELETE /api/employees/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: 'Invalid employee ID' }, { status: 400 })
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid employee ID format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete employee' },
      { status: 500 }
    )
  }
}
