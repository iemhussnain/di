/**
 * User Settings API
 * Get and update user profile and FBR settings
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { getToken } from 'next-auth/jwt'
import User from '@/lib/models/User'

export async function GET(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Fetch user with selected fields (exclude password, include tokens)
    const user = await User.findById(token.id)
      .select('-password +fbr_sandbox_token +fbr_production_token')

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        employee_id: user.employee_id,
        role: user.role,
        company_ntn: user.company_ntn || '',
        company_strn: user.company_strn || '',
        company_ref_no: user.company_ref_no || '',
        company_province: user.company_province || '',
        company_address: user.company_address || '',
        fbr_sandbox_token: user.fbr_sandbox_token || '',
        fbr_production_token: user.fbr_production_token || '',
        fbr_registration_status: user.fbr_registration_status || 'Not Registered'
      }
    })

  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Get updated data from request
    const updateData = await request.json()

    // Validate NTN format if provided
    if (updateData.company_ntn) {
      if (!/^\d{7}$/.test(updateData.company_ntn)) {
        return NextResponse.json(
          { error: 'NTN must be exactly 7 digits' },
          { status: 400 }
        )
      }
    }

    // Validate STRN format if provided
    if (updateData.company_strn) {
      if (!/^\d{2}-\d{2}-\d{4}-\d{3}-\d{2}$/.test(updateData.company_strn)) {
        return NextResponse.json(
          { error: 'STRN format must be 00-00-0000-000-00' },
          { status: 400 }
        )
      }
    }

    // Validate Reference Number format if provided
    if (updateData.company_ref_no) {
      if (!/^\d{7}-\d$/.test(updateData.company_ref_no)) {
        return NextResponse.json(
          { error: 'Reference Number format must be 0000000-0' },
          { status: 400 }
        )
      }
    }

    // Fields that can be updated
    const allowedFields = [
      'name',
      'company_ntn',
      'company_strn',
      'company_ref_no',
      'company_province',
      'company_address',
      'fbr_sandbox_token',
      'fbr_production_token',
      'fbr_registration_status'
    ]

    // Filter only allowed fields
    const filteredData = {}
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field]
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      token.id,
      { $set: filteredData },
      { new: true, runValidators: true }
    ).select('-password +fbr_sandbox_token +fbr_production_token')

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        employee_id: updatedUser.employee_id,
        role: updatedUser.role,
        company_ntn: updatedUser.company_ntn || '',
        company_strn: updatedUser.company_strn || '',
        company_ref_no: updatedUser.company_ref_no || '',
        company_province: updatedUser.company_province || '',
        company_address: updatedUser.company_address || '',
        fbr_sandbox_token: updatedUser.fbr_sandbox_token || '',
        fbr_production_token: updatedUser.fbr_production_token || '',
        fbr_registration_status: updatedUser.fbr_registration_status || 'Not Registered'
      }
    })

  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
