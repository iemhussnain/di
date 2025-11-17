import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import Leave from '@/lib/models/Leave'

/**
 * GET /api/leaves/pending
 * Get all pending leave applications
 */
export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to view pending leaves
    if (token.role !== 'Admin' && token.role !== 'Manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions to view pending leave applications' },
        { status: 403 }
      )
    }

    await dbConnect()

    // Get pending leaves
    const pendingLeaves = await Leave.getPendingLeaves()

    return NextResponse.json({
      success: true,
      data: pendingLeaves,
      total: pendingLeaves.length,
    })
  } catch (error) {
    console.error('Error fetching pending leaves:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pending leaves' },
      { status: 500 }
    )
  }
}
