import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Leave from '@/lib/models/Leave'

/**
 * POST /api/leaves/[id]/cancel
 * Cancel a leave application
 */
export async function POST(req, { params }) {
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

    // Cancel the leave
    await leave.cancel()

    // Populate references
    await leave.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'applied_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: leave,
      message: 'Leave application cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling leave application:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel leave application' },
      { status: 500 }
    )
  }
}
