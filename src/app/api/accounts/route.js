/**
 * Accounts API Route
 * GET /api/accounts - List all accounts with pagination and filters
 * POST /api/accounts - Create new account
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Account from '@/lib/models/Account'
import { createAccountSchema, accountQuerySchema } from '@/lib/validation/account'
import { z } from 'zod'

// GET /api/accounts - List all accounts
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)

    // Validate and parse query parameters
    const { page, limit, account_type, is_header, is_active, search, parent_id } =
      accountQuerySchema.parse(queryParams)

    // Build filter
    const filter = {}

    if (account_type) {
      filter.account_type = account_type
    }

    if (is_header !== undefined) {
      filter.is_header = is_header
    }

    if (is_active !== undefined) {
      filter.is_active = is_active
    }

    if (parent_id !== undefined) {
      filter.parent_id = parent_id === 'null' ? null : parent_id
    }

    if (search) {
      filter.$or = [
        { account_code: { $regex: search, $options: 'i' } },
        { account_name: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const [accounts, total] = await Promise.all([
      Account.find(filter)
        .populate('parent_id', 'account_code account_name')
        .sort({ account_code: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Account.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: accounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/accounts error:', error)

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

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch accounts',
      },
      { status: 500 }
    )
  }
}

// POST /api/accounts - Create new account
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()

    // Validate request body
    const validatedData = createAccountSchema.parse(body)

    // Check if account code already exists
    const existingAccount = await Account.findOne({
      account_code: validatedData.account_code.toUpperCase(),
    })

    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account code already exists',
        },
        { status: 400 }
      )
    }

    // If parent_id is provided, verify parent exists and is a header account
    if (validatedData.parent_id) {
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

      // Verify parent has same account type
      if (parent.account_type !== validatedData.account_type) {
        return NextResponse.json(
          {
            success: false,
            error: 'Child account must have same type as parent',
          },
          { status: 400 }
        )
      }
    }

    // Create account
    const account = await Account.create({
      ...validatedData,
      account_code: validatedData.account_code.toUpperCase(),
    })

    // Populate parent info
    await account.populate('parent_id', 'account_code account_name')

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        data: account,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/accounts error:', error)

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
        error: error.message || 'Failed to create account',
      },
      { status: 500 }
    )
  }
}
