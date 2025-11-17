import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Payroll from '@/lib/models/Payroll'

/**
 * GET /api/payroll/[id]
 * Get a single payroll record
 */
export async function GET(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const payroll = await Payroll.findById(params.id)
      .populate('employee_id', 'name employee_code department email bank_account')
      .populate('created_by', 'name email')
      .populate('processed_by', 'name email')
      .populate('journal_entry_id')

    if (!payroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: payroll,
    })
  } catch (error) {
    console.error('Error fetching payroll record:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payroll record' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/payroll/[id]
 * Update a payroll record (only if Draft)
 */
export async function PUT(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (token.role !== 'Admin' && token.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update payroll' },
        { status: 403 }
      )
    }

    await dbConnect()

    const body = await req.json()

    const payroll = await Payroll.findById(params.id)

    if (!payroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      )
    }

    // Only allow editing if Draft
    if (payroll.status !== 'Draft') {
      return NextResponse.json(
        { error: 'Can only edit payroll in Draft status' },
        { status: 400 }
      )
    }

    // Update fields
    Object.assign(payroll, body)
    await payroll.save()

    // Populate references
    await payroll.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'created_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: payroll,
      message: 'Payroll record updated successfully',
    })
  } catch (error) {
    console.error('Error updating payroll record:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update payroll record' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/payroll/[id]
 * Delete a payroll record (only if Draft)
 */
export async function DELETE(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can delete payroll
    if (token.role !== 'Admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete payroll' },
        { status: 403 }
      )
    }

    await dbConnect()

    const payroll = await Payroll.findById(params.id)

    if (!payroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      )
    }

    // Only allow deletion if Draft
    if (payroll.status !== 'Draft') {
      return NextResponse.json(
        { error: 'Can only delete payroll in Draft status' },
        { status: 400 }
      )
    }

    await payroll.deleteOne()

    return NextResponse.json({
      success: true,
      message: 'Payroll record deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting payroll record:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete payroll record' },
      { status: 500 }
    )
  }
}
