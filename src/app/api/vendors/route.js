/**
 * Vendors API Routes
 * Handles vendor listing and creation
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import Vendor from '@/lib/models/Vendor'
import { createVendorSchema, vendorQuerySchema } from '@/lib/validation/vendor'

/**
 * GET /api/vendors
 * List vendors with pagination, search, and filters
 */
export async function GET(request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedQuery = vendorQuerySchema.parse(query)
    const { page, limit, search, status, is_registered, sort_by, order } = validatedQuery

    // Build filter
    const filter = {}

    // Status filter
    if (status && status !== 'all') {
      filter.status = status
    }

    // Registration filter
    if (is_registered && is_registered !== 'all') {
      filter.is_registered = is_registered === 'true'
    }

    // Search filter
    if (search) {
      filter.$or = [
        { vendor_name: { $regex: search, $options: 'i' } },
        { vendor_code: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build sort object
    const sort = { [sort_by]: order === 'asc' ? 1 : -1 }

    // Execute query
    const [vendors, total] = await Promise.all([
      Vendor.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Vendor.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/vendors error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vendors
 * Create a new vendor
 */
export async function POST(request) {
  try {
    await dbConnect()

    const body = await request.json()

    // Validate request body
    const validatedData = createVendorSchema.parse(body)

    // Check for duplicate vendor name
    const existingVendor = await Vendor.findOne({
      vendor_name: { $regex: `^${validatedData.vendor_name}$`, $options: 'i' },
    })

    if (existingVendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor with this name already exists' },
        { status: 409 }
      )
    }

    // Create vendor
    const vendor = await Vendor.create(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: vendor,
        message: 'Vendor created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/vendors error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Vendor with this code already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
