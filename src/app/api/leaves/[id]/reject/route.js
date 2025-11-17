import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Leave from '@/lib/models/Leave'

/**
 * POST /api/leaves/[id]/reject
 * Reject a leave application
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has rejection permission
    if (token.role !== 'Admin' && token.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to reject leave applications' },
        { status: 403 }
      )
    }

    await dbConnect()

    const body = await req.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Please provide a rejection reason' },
        { status: 400 }
      )
    }

    const leave = await Leave.findById(params.id)

    if (!leave) {
      return NextResponse.json(
        { error: 'Leave application not found' },
        { status: 404 }
      )
    }

    // Reject the leave
    await leave.reject(token.id, reason)

    // Populate references
    await leave.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'applied_by', select: 'name' },
      { path: 'approved_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: leave,
      message: 'Leave application rejected successfully',
    })
  } catch (error) {
    console.error('Error rejecting leave application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject leave application' },
      { status: 500 }
    )
  }
}
