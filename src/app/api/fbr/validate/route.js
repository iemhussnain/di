/**
 * FBR Invoice Validation API
 * Validates invoice data against FBR sandbox before submission
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { getCurrentUserId } from '@/lib/utils/session'
import User from '@/lib/models/User'
import FBRService from '@/lib/services/fbrService'

export async function POST(request) {
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

    // Get invoice data from request
    const invoiceData = await request.json()

    // Validate required fields
    if (!invoiceData.invoiceType) {
      return NextResponse.json(
        { error: 'Invoice type is required' },
        { status: 400 }
      )
    }

    if (!invoiceData.items || invoiceData.items.length === 0) {
      return NextResponse.json(
        { error: 'Invoice must have at least one item' },
        { status: 400 }
      )
    }

    // Call FBR validation API
    const validationResult = await FBRService.validateInvoiceSandbox(
      user.fbr_sandbox_token,
      invoiceData
    )

    // Check if validation was successful
    const isValid = validationResult.status === 'Valid' || validationResult.isValid === true

    return NextResponse.json({
      success: true,
      isValid,
      message: validationResult.message || (isValid ? 'Invoice validation successful' : 'Invoice validation failed'),
      data: validationResult,
    })

  } catch (error) {
    console.error('FBR validation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to validate invoice' },
      { status: 500 }
    )
  }
}
