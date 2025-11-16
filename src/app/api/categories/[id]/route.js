/**
 * Single Category API Route
 * GET /api/categories/:id - Get single category
 * PUT /api/categories/:id - Update category
 * DELETE /api/categories/:id - Delete category
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Category from '@/lib/models/Category'
import Item from '@/lib/models/Item'
import { updateCategorySchema } from '@/lib/validation/category'
import { errorHandler } from '@/lib/errors/errorHandler'
import mongoose from 'mongoose'

// GET /api/categories/:id
export async function GET(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category ID',
        },
        { status: 400 }
      )
    }

    const category = await Category.findById(id).populate('parent_id', 'category_name')

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    // Get children count
    const children = await category.getChildren()

    // Get items count
    const itemsCount = await Item.countDocuments({ category_id: id })

    return NextResponse.json({
      success: true,
      data: {
        ...category.toObject(),
        children_count: children.length,
        items_count: itemsCount,
      },
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}

// PUT /api/categories/:id
export async function PUT(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category ID',
        },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate request body
    const validatedData = updateCategorySchema.parse(body)

    // Find existing category
    const existingCategory = await Category.findById(id)

    if (!existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    // Check if category name is being changed and if new name already exists
    if (validatedData.category_name && validatedData.category_name !== existingCategory.category_name) {
      const duplicateCategory = await Category.findOne({
        category_name: validatedData.category_name,
        _id: { $ne: id },
      })

      if (duplicateCategory) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category name already exists',
          },
          { status: 400 }
        )
      }
    }

    // If parent_id is being changed, verify new parent
    if (validatedData.parent_id !== undefined && validatedData.parent_id !== null) {
      const parent = await Category.findById(validatedData.parent_id)

      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            error: 'Parent category not found',
          },
          { status: 404 }
        )
      }

      // Cannot set self as parent
      if (parent._id.toString() === id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category cannot be its own parent',
          },
          { status: 400 }
        )
      }
    }

    // Update category
    const category = await Category.findByIdAndUpdate(id, validatedData, {
      new: true,
      runValidators: true,
    }).populate('parent_id', 'category_name')

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'PUT',
    })
  }
}

// DELETE /api/categories/:id
export async function DELETE(request, { params }) {
  try {
    await connectDB()

    const { id } = params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category ID',
        },
        { status: 400 }
      )
    }

    const category = await Category.findById(id)

    if (!category) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category not found',
        },
        { status: 404 }
      )
    }

    // Check if category has children
    const children = await category.getChildren()
    if (children.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category with subcategories',
        },
        { status: 400 }
      )
    }

    // Check if category has items
    const itemsCount = await Item.countDocuments({ category_id: id })
    if (itemsCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete category with existing items',
        },
        { status: 400 }
      )
    }

    // Soft delete
    await Category.findByIdAndUpdate(id, { is_active: false })

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'DELETE',
    })
  }
}
