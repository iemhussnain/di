/**
 * Single Account API Route
 * GET /api/accounts/:id - Get single account
 * PUT /api/accounts/:id - Update account
 * DELETE /api/accounts/:id - Delete account
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Account from '@/lib/models/Account'
import { updateAccountSchema } from '@/lib/validation/account'
import { z } from 'zod'
import mongoose from 'mongoose'

// GET /api/accounts/:id - Get single account
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid account ID',
        },
        { status: 400 }
      )
    }

    const account = await Account.findById(id).populate('parent_id', 'account_code account_name')

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not found',
        },
        { status: 404 }
      )
    }

    // Get hierarchy path
    const hierarchyPath = await Account.getHierarchyPath(id)

    // Get children
    const children = await account.getChildren()

    return NextResponse.json({
      success: true,
      data: {
        ...account.toObject(),
        hierarchy_path: hierarchyPath,
        children_count: children.length,
        has_children: children.length > 0,
      },
    })
  } catch (error) {
    console.error('GET /api/accounts/:id error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch account',
      },
      { status: 500 }
    )
  }
}

// PUT /api/accounts/:id - Update account
export async function PUT(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid account ID',
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validatedData = updateAccountSchema.parse(body)

    // Find existing account
    const existingAccount = await Account.findById(id)

    if (!existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not found',
        },
        { status: 404 }
      )
    }

    // Check if account code is being changed and if new code already exists
    if (validatedData.account_code && validatedData.account_code !== existingAccount.account_code) {
      const duplicateAccount = await Account.findOne({
        account_code: validatedData.account_code.toUpperCase(),
        _id: { $ne: id },
      })

      if (duplicateAccount) {
        return NextResponse.json(
          {
            success: false,
            error: 'Account code already exists',
          },
          { status: 400 }
        )
      }
    }

    // If parent_id is being changed, verify new parent
    if (validatedData.parent_id !== undefined && validatedData.parent_id !== null) {
      const parent = await Account.findById(validatedData.parent_id)

      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            error: 'Parent account not found',
          },
          { status: 404 }
        )
      }

      if (!parent.is_header) {
        return NextResponse.json(
          {
            success: false,
            error: 'Parent account must be a header account',
          },
          { status: 400 }
        )
      }

      // Cannot set self as parent
      if (parent._id.toString() === id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Account cannot be its own parent',
          },
          { status: 400 }
        )
      }

      // Verify parent has same account type
      const accountType = validatedData.account_type || existingAccount.account_type
      if (parent.account_type !== accountType) {
        return NextResponse.json(
          {
            success: false,
            error: 'Child account must have same type as parent',
          },
          { status: 400 }
        )
      }
    }

    // If changing to header account, verify no opening balance
    if (validatedData.is_header === true) {
      const openingBalance = validatedData.opening_balance ?? existingAccount.opening_balance
      if (openingBalance !== 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Header accounts cannot have opening balance',
          },
          { status: 400 }
        )
      }
    }

    // Update account
    const updateData = { ...validatedData }
    if (updateData.account_code) {
      updateData.account_code = updateData.account_code.toUpperCase()
    }

    const account = await Account.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('parent_id', 'account_code account_name')

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
      data: account,
    })
  } catch (error) {
    console.error('PUT /api/accounts/:id error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account code already exists',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update account',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/accounts/:id - Delete account
export async function DELETE(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid account ID',
        },
        { status: 400 }
      )
    }

    const account = await Account.findById(id)

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account not found',
        },
        { status: 404 }
      )
    }

    // Check if account has children
    const children = await account.getChildren()
    if (children.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete account with child accounts',
        },
        { status: 400 }
      )
    }

    // Check if account has transactions (will be implemented later)
    // For now, just delete the account

    // Soft delete by setting is_active to false (recommended)
    await Account.findByIdAndUpdate(id, { is_active: false })

    // Hard delete (uncomment if you want permanent deletion)
    // await Account.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/accounts/:id error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete account',
      },
      { status: 500 }
    )
  }
}
