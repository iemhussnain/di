/**
 * Low Stock Items API Route
 * GET /api/items/low-stock - Get items with low stock
 */

import { NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongodb'
import Item from '@/lib/models/Item'
import { errorHandler } from '@/lib/errors/errorHandler'

// GET /api/items/low-stock
export async function GET(request) {
  try {
    await connectDB()

    // Get all active items
    const items = await Item.find({ is_active: true }).populate('category_id', 'category_name')

    // Filter items with low stock using virtual field
    const lowStockItems = items.filter((item) => item.is_low_stock)

    // Sort by urgency (lowest stock first)
    lowStockItems.sort((a, b) => {
      const aUrgency = a.total_qty - a.reorder_level
      const bUrgency = b.total_qty - b.reorder_level
      return aUrgency - bUrgency
    })

    return NextResponse.json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length,
    })
  } catch (error) {
    return errorHandler(error, {
      url: request.url,
      method: 'GET',
    })
  }
}
