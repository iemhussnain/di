import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import dbConnect from '@/lib/db/mongodb'
import PurchaseOrder from '@/lib/models/PurchaseOrder'

/**
 * GET /api/purchase-orders
 * List all purchase orders with filters
 */
export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const vendor_id = searchParams.get('vendor_id')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Build query
    const query = {}
    if (status) query.status = status
    if (vendor_id) query.vendor_id = vendor_id
    if (from_date || to_date) {
      query.order_date = {}
      if (from_date) query.order_date.$gte = new Date(from_date)
      if (to_date) query.order_date.$lte = new Date(to_date)
    }

    // Execute query with pagination
    const skip = (page - 1) * limit
    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query)
        .populate('vendor_id', 'name vendor_code')
        .populate('created_by', 'name')
        .populate('approved_by', 'name')
        .sort({ order_date: -1, order_number: -1 })
        .limit(limit)
        .skip(skip),
      PurchaseOrder.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/purchase-orders
 * Create a new purchase order
 */
export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const body = await req.json()

    // Generate order number
    const orderNumber = await PurchaseOrder.generateOrderNumber()

    // Create purchase order
    const purchaseOrder = await PurchaseOrder.create({
      ...body,
      order_number: orderNumber,
      created_by: token.id,
    })

    // Populate references
    await purchaseOrder.populate([
      { path: 'vendor_id', select: 'name vendor_code' },
      { path: 'created_by', select: 'name' },
    ])

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
      message: 'Purchase order created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}
