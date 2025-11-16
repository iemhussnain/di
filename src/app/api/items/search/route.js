/**
 * Item Search API Route
 * GET /api/items/search?q=query - Search items
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Item from '@/lib/models/Item'
import { errorHandler } from '@/lib/errors/errorHandler'

// GET /api/items/search
export async function GET(request) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query is required',
        },
        { status: 400 }
      )
    }

    // Search items using text index or regex
    const items = await Item.find({
      $or: [
        { item_code: { $regex: query, $options: 'i' } },
        { item_name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
      is_active: true,
    })
      .populate('category_id', 'category_name')
      .limit(20)
      .lean()

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}
