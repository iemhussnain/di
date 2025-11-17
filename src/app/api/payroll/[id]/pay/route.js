import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Payroll from '@/lib/models/Payroll'

/**
 * POST /api/payroll/[id]/pay
 * Mark payroll as paid
 */
export async function POST(req, { params }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (token.role !== 'Admin' && token.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to mark payroll as paid' },
        { status: 403 }
      )
    }

    await dbConnect()

    const body = await req.json()
    const { payment_mode, transaction_reference } = body

    if (!payment_mode) {
      return NextResponse.json(
        { error: 'Please provide payment mode' },
        { status: 400 }
      )
    }

    const payroll = await Payroll.findById(params.id)

    if (!payroll) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      )
    }

    // Mark as paid
    await payroll.markPaid(payment_mode, transaction_reference)

    // TODO: Create journal entry for payment
    // Example entry:
    // Dr. Salary Payable
    // Cr. Bank/Cash Account

    // Populate references
    await payroll.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'created_by', select: 'name' },
      { path: 'processed_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: payroll,
      message: 'Payroll marked as paid successfully',
    })
  } catch (error) {
    console.error('Error marking payroll as paid:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark payroll as paid' },
      { status: 500 }
    )
  }
}
