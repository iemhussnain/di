/**
 * Single Item API Route
 * GET /api/items/:id - Get single item
 * PUT /api/items/:id - Update item
 * DELETE /api/items/:id - Delete item
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Item from '@/lib/models/Item'
import { updateItemSchema } from '@/lib/validation/item'
import { errorHandler } from '@/lib/errors/errorHandler'
import mongoose from 'mongoose'

// GET /api/items/:id
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid item ID',
        },
        { status: 400 }
      )
    }

    const item = await Item.findById(id).populate('category_id', 'category_name')

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: item,
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}

// PUT /api/items/:id
export async function PUT(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid item ID',
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validatedData = updateItemSchema.parse(body)

    // Find existing item
    const existingItem = await Item.findById(id)

    if (!existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found',
        },
        { status: 404 }
      )
    }

    // Check if item code is being changed and if new code already exists
    if (validatedData.item_code && validatedData.item_code !== existingItem.item_code) {
      const duplicateItem = await Item.findOne({
        item_code: validatedData.item_code.toUpperCase(),
        _id: { $ne: id },
      })

      if (duplicateItem) {
        return NextResponse.json(
          {
            success: false,
            error: 'Item code already exists',
          },
          { status: 400 }
        )
      }
    }

    // If category_id is being changed, verify new category
    if (validatedData.category_id !== undefined && validatedData.category_id !== null) {
      const Category = (await import('@/lib/models/Category')).default
      const category = await Category.findById(validatedData.category_id)

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category not found',
          },
          { status: 404 }
        )
      }
    }

    // Prevent direct stock quantity updates (should use stock movement)
    if (
      validatedData.registered_qty !== undefined ||
      validatedData.unregistered_qty !== undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Stock quantities cannot be updated directly. Use stock movement transactions.',
        },
        { status: 400 }
      )
    }

    // Update item
    const updateData = { ...validatedData }
    if (updateData.item_code) {
      updateData.item_code = updateData.item_code.toUpperCase()
    }

    const item = await Item.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('category_id', 'category_name')

    return NextResponse.json({
      success: true,
      message: 'Item updated successfully',
      data: item,
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'PUT',
    })
  }
}

// DELETE /api/items/:id
export async function DELETE(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid item ID',
        },
        { status: 400 }
      )
    }

    const item = await Item.findById(id)

    if (!item) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item not found',
        },
        { status: 404 }
      )
    }

    // Check if item has stock (optional - you may want to allow deletion)
    const hasStock = item.registered_qty > 0 || item.unregistered_qty > 0
    if (hasStock) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete item with existing stock',
        },
        { status: 400 }
      )
    }

    // Soft delete by setting is_active to false
    await Item.findByIdAndUpdate(id, { is_active: false })

    return NextResponse.json({
      success: true,
      message: 'Item deleted successfully',
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'DELETE',
    })
  }
}
