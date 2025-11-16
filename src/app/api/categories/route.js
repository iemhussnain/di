/**
 * Categories API Route
 * GET /api/categories - List all categories
 * POST /api/categories - Create new category
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Category from '@/lib/models/Category'
import { createCategorySchema, categoryQuerySchema } from '@/lib/validation/category'
import { errorHandler } from '@/lib/errors/errorHandler'
import { z } from 'zod'

// GET /api/categories - List all categories
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)

    // Validate and parse query parameters
    const { page, limit, is_active, search, parent_id } = categoryQuerySchema.parse(queryParams)

    // Build filter
    const filter = {}

    if (is_active !== undefined) {
      filter.is_active = is_active
    }

    if (parent_id !== undefined) {
      filter.parent_id = parent_id === 'null' ? null : parent_id
    }

    if (search) {
      filter.category_name = { $regex: search, $options: 'i' }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate('parent_id', 'category_name')
        .sort({ category_name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Category.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}

// POST /api/categories - Create new category
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()

    // Validate request body
    const validatedData = createCategorySchema.parse(body)

    // Check if category name already exists
    const existingCategory = await Category.findOne({
      category_name: validatedData.category_name,
    })

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: 'Category name already exists',
        },
        { status: 400 }
      )
    }

    // If parent_id is provided, verify parent exists
    if (validatedData.parent_id) {
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
    }

    // Create category
    const category = await Category.create(validatedData)

    // Populate parent info
    await category.populate('parent_id', 'category_name')

    return NextResponse.json(
      {
        success: true,
        message: 'Category created successfully',
        data: category,
      },
      { status: 201 }
    )
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'POST',
    })
  }
}
