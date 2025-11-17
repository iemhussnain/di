/**
 * FBR STATL API
 * Check FBR registration status using NTN
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import { getCurrentUserId } from '@/lib/utils/session'
import User from '@/lib/models/User'
import FBRService from '@/lib/services/fbrService'

export async function GET(request) {
  try {
    await dbConnect()

    // Get current user ID
    const userId = await getCurrentUserId()

    // Get user with FBR token
    const user = await User.findById(userId).select('+fbr_sandbox_token')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!user.fbr_sandbox_token) {
      return NextResponse.json(
        { error: 'FBR sandbox token not configured. Please update your settings.' },
        { status: 400 }
      )
    }

    // Get NTN from query parameters
    const { searchParams } = new URL(request.url)
    const ntn = searchParams.get('ntn')

    if (!ntn) {
      return NextResponse.json(
        { error: 'NTN is required' },
        { status: 400 }
      )
    }

    // Validate NTN format
    if (!/^\d{7}$/.test(ntn)) {
      return NextResponse.json(
        { error: 'NTN must be exactly 7 digits' },
        { status: 400 }
      )
    }

    // Call FBR STATL API to check registration status
    const statlResult = await FBRService.checkSTATL(user.fbr_sandbox_token, ntn)

    // Extract status and province from response
    const status = statlResult.status || statlResult.registrationStatus || 'Not Registered'
    const province = statlResult.province || statlResult.stateProvince || null
    const registrationType = statlResult.registrationType || null

    return NextResponse.json({
      success: true,
      ntn,
      status,
      province,
      registrationType,
      data: statlResult
    })

  } catch (error) {
    console.error('STATL check error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check registration status' },
      { status: 500 }
    )
  }
}
