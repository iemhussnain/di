/**
 * Individual Vendor API Routes
 * Handles single vendor operations (get, update, delete)
 */

import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import Vendor from '@/lib/models/Vendor'
import { updateVendorSchema, vendorIdSchema } from '@/lib/validation/vendor'

/**
 * GET /api/vendors/[id]
 * Get a single vendor by ID
 */
export async function GET(request, { params }) {
  try {
    await dbConnect()

    const { id } = params

    // Validate vendor ID
    vendorIdSchema.parse(id)

    const vendor = await Vendor.findById(id).lean()

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: vendor,
    })
  } catch (error) {
    console.error('GET /api/vendors/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid vendor ID' },
        { status: 400 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid vendor ID format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/vendors/[id]
 * Update a vendor by ID
 */
export async function PUT(request, { params }) {
  try {
    await dbConnect()

    const { id } = params
    const body = await request.json()

    // Validate vendor ID
    vendorIdSchema.parse(id)

    // Validate request body
    const validatedData = updateVendorSchema.parse(body)

    // Check if vendor exists
    const vendor = await Vendor.findById(id)

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Check for duplicate vendor name (if name is being updated)
    if (validatedData.vendor_name && validatedData.vendor_name !== vendor.vendor_name) {
      const existingVendor = await Vendor.findOne({
        _id: { $ne: id },
        vendor_name: { $regex: `^${validatedData.vendor_name}$`, $options: 'i' },
      })

      if (existingVendor) {
        return NextResponse.json(
          { success: false, error: 'Vendor with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update vendor
    const updatedVendor = await Vendor.findByIdAndUpdate(
      id,
      { $set: validatedData },
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      success: true,
      data: updatedVendor,
      message: 'Vendor updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/vendors/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid vendor ID format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/vendors/[id]
 * Soft delete a vendor by setting status to Inactive
 */
export async function DELETE(request, { params }) {
  try {
    await dbConnect()

    const { id } = params

    // Validate vendor ID
    vendorIdSchema.parse(id)

    // Check if vendor exists
    const vendor = await Vendor.findById(id)

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting status to Inactive
    vendor.status = 'Inactive'
    await vendor.save()

    return NextResponse.json({
      success: true,
      message: 'Vendor deactivated successfully',
    })
  } catch (error) {
    console.error('DELETE /api/vendors/[id] error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid vendor ID' },
        { status: 400 }
      )
    }

    if (error.name === 'CastError') {
      return NextResponse.json(
        { success: false, error: 'Invalid vendor ID format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}
