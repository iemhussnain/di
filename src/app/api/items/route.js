/**
 * Items API Route
 * GET /api/items - List all items
 * POST /api/items - Create new item
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Item from '@/lib/models/Item'
import { createItemSchema, itemQuerySchema } from '@/lib/validation/item'
import { errorHandler } from '@/lib/errors/errorHandler'

// GET /api/items - List all items
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)

    // Validate and parse query parameters
    const { page, limit, category_id, is_active, search, low_stock } =
      itemQuerySchema.parse(queryParams)

    // Build filter
    const filter = {}

    if (category_id) {
      filter.category_id = category_id
    }

    if (is_active !== undefined) {
      filter.is_active = is_active
    }

    if (search) {
      filter.$or = [
        { item_code: { $regex: search, $options: 'i' } },
        { item_name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Execute query
    let query = Item.find(filter)
      .populate('category_id', 'category_name')
      .sort({ item_code: 1 })
      .skip(skip)
      .limit(limit)

    const [items, total] = await Promise.all([query.lean(), Item.countDocuments(filter)])

    // Filter low stock items if requested
    let data = items
    if (low_stock) {
      // Need to calculate virtual field manually for lean documents
      data = items.filter((item) => {
        const total_qty = item.registered_qty + item.unregistered_qty
        return total_qty <= item.reorder_level
      })
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: low_stock ? data.length : total,
        pages: Math.ceil((low_stock ? data.length : total) / limit),
      },
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}

// POST /api/items - Create new item
export async function POST(request) {
  try {
    await connectDB()

    const body = await request.json()

    // Validate request body
    const validatedData = createItemSchema.parse(body)

    // Check if item code already exists
    const existingItem = await Item.findOne({
      item_code: validatedData.item_code.toUpperCase(),
    })

    if (existingItem) {
      return NextResponse.json(
        {
          success: false,
          error: 'Item code already exists',
        },
        { status: 400 }
      )
    }

    // If category_id is provided, verify category exists
    if (validatedData.category_id) {
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

    // Create item
    const item = await Item.create({
      ...validatedData,
      item_code: validatedData.item_code.toUpperCase(),
    })

    // Populate category info
    await item.populate('category_id', 'category_name')

    return NextResponse.json(
      {
        success: true,
        message: 'Item created successfully',
        data: item,
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
