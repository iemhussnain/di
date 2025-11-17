import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Payroll from '@/lib/models/Payroll'

/**
 * POST /api/payroll/[id]/process
 * Process payroll (finalize calculations)
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
        { error: 'Insufficient permissions to process payroll' },
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

    // Process the payroll
    await payroll.processPayroll(token.id)

    // TODO: Create journal entry for payroll
    // Example entry:
    // Dr. Salary Expense (gross_salary)
    // Cr. Salary Payable (net_salary)
    // Cr. Tax Payable (deductions)

    // Populate references
    await payroll.populate([
      { path: 'employee_id', select: 'name employee_code department' },
      { path: 'created_by', select: 'name' },
      { path: 'processed_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: payroll,
      message: 'Payroll processed successfully',
    })
  } catch (error) {
    console.error('Error processing payroll:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process payroll' },
      { status: 500 }
    )
  }
}
