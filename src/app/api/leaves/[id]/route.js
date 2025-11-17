import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Leave from '@/lib/models/Leave'

/**
 * GET /api/leaves/[id]
 * Get a single leave application
 */
export async function GET(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const leave = await Leave.findById(params.id)
      .populate('employee_id', 'name employee_code department email phone')
      .populate('applied_by', 'name email')
      .populate('approved_by', 'name email')

    if (!leave) {
      return NextResponse.json(
        { error: 'Leave application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: leave,
    })
  } catch (error) {
    console.error('Error fetching leave application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leave application' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/leaves/[id]
 * Update a leave application
 */
export async function PUT(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()

    const leave = await Leave.findById(params.id)

    if (!leave) {
      return NextResponse.json(
        { error: 'Leave application not found' },
        { status: 404 }
      )
    }

    // Only allow editing pending leaves
    if (leave.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Can only edit pending leave applications' },
        { status: 400 }
      )
    }

    // Update fields
    Object.assign(leave, body)
    await leave.save()

    // Populate references
    await leave.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'applied_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: leave,
      message: 'Leave application updated successfully',
    })
  } catch (error) {
    console.error('Error updating leave application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update leave application' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/leaves/[id]
 * Delete a leave application (only if Pending)
 */
export async function DELETE(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const leave = await Leave.findById(params.id)

    if (!leave) {
      return NextResponse.json(
        { error: 'Leave application not found' },
        { status: 404 }
      )
    }

    // Only allow deletion if Pending
    if (leave.status !== 'Pending') {
      return NextResponse.json(
        { error: 'Can only delete pending leave applications' },
        { status: 400 }
      )
    }

    await leave.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Leave application deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting leave application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete leave application' },
      { status: 500 }
    )
  }
}
