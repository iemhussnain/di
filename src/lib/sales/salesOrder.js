/**
 * Sales Order Helper Functions
 * Business logic for sales order operations
 */

import mongoose from 'mongoose'
import SalesOrder from '@/lib/models/SalesOrder'
import SalesInvoice from '@/lib/models/SalesInvoice'
import Customer from '@/lib/models/Customer'
import Item from '@/lib/models/Item'

/**
 * Create a new sales order
 * @param {Object} orderData - Sales order data
 * @returns {Promise<Object>}
 */
export async function createSalesOrder(orderData) {
  // Fetch customer details
  const customer = await Customer.findById(orderData.customer_id)
  if (!customer) {
    throw new Error('Customer not found')
  }

  if (customer.status !== 'Active') {
    throw new Error(`Customer is ${customer.status}`)
  }

  // Check credit limit
  const canPurchase = customer.canPurchase(orderData.grand_total || 0)
  if (!canPurchase.allowed) {
    throw new Error(canPurchase.reason)
  }

  // Populate line items with product details
  const lines = []
  for (const line of orderData.lines) {
    const item = await Item.findById(line.item_id)
    if (!item) {
      throw new Error(`Item with ID ${line.item_id} not found`)
    }

    if (!item.is_active) {
      throw new Error(`Item ${item.item_name} is not active`)
    }

    // Check stock availability
    const totalStock = item.total_qty
    if (totalStock < line.quantity) {
      throw new Error(
        `Insufficient stock for ${item.item_name}. Available: ${totalStock}, Requested: ${line.quantity}`
      )
    }

    lines.push({
      item_id: item._id,
      description: line.description || item.description,
      quantity: line.quantity,
      unit_price: line.unit_price || item.selling_price,
      discount_percentage: line.discount_percentage || 0,
      discount_amount: line.discount_amount || 0,
      tax_percentage: line.tax_percentage || item.tax_rate,
      tax_amount: line.tax_amount || 0,
      line_total: 0, // Will be calculated by model
    })
  }

  // Create sales order
  const salesOrder = new SalesOrder({
    ...orderData,
    customer_name: customer.customer_name,
    customer_code: customer.customer_code,
    payment_terms: orderData.payment_terms || customer.payment_terms,
    lines,
  })

  // Use default shipping address from customer if not provided
  if (!orderData.shipping_address && customer.address) {
    salesOrder.shipping_address = customer.address
  }

  await salesOrder.save()
  return salesOrder
}

/**
 * Create invoice from sales order
 * @param {String} orderId - Sales order ID
 * @param {Object} options - Invoice options
 * @returns {Promise<Object>}
 */
export async function createInvoiceFromOrder(orderId, options = {}) {
  const salesOrder = await SalesOrder.findById(orderId).populate('customer_id')

  if (!salesOrder) {
    throw new Error('Sales order not found')
  }

  if (salesOrder.status !== 'Confirmed') {
    throw new Error('Only confirmed orders can be invoiced')
  }

  if (salesOrder.invoice_id) {
    throw new Error('Sales order already has an invoice')
  }

  const customer = salesOrder.customer_id

  // Calculate due date based on payment terms
  const invoiceDate = options.invoice_date ? new Date(options.invoice_date) : new Date()
  let dueDate = new Date(invoiceDate)

  switch (salesOrder.payment_terms) {
    case 'Net 7':
      dueDate.setDate(dueDate.getDate() + 7)
      break
    case 'Net 15':
      dueDate.setDate(dueDate.getDate() + 15)
      break
    case 'Net 30':
      dueDate.setDate(dueDate.getDate() + 30)
      break
    case 'Net 60':
      dueDate.setDate(dueDate.getDate() + 60)
      break
    case 'Net 90':
      dueDate.setDate(dueDate.getDate() + 90)
      break
    default:
      // Cash - due immediately
      break
  }

  // Create invoice
  const invoice = new SalesInvoice({
    invoice_date: invoiceDate,
    due_date: dueDate,
    customer_id: customer._id,
    customer_name: customer.customer_name,
    customer_code: customer.customer_code,
    customer_ntn: customer.ntn,
    customer_strn: customer.strn,
    sales_order_id: salesOrder._id,
    sales_order_no: salesOrder.order_no,
    payment_terms: salesOrder.payment_terms,
    lines: salesOrder.lines.map((line) => ({
      item_id: line.item_id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_percentage: line.discount_percentage,
      discount_amount: line.discount_amount,
      tax_percentage: line.tax_percentage,
      tax_amount: line.tax_amount,
      line_total: line.line_total,
    })),
    notes: salesOrder.notes,
    created_by: options.created_by,
  })

  await invoice.save()

  // Update sales order
  await salesOrder.markAsInvoiced(invoice._id, options.created_by)

  return invoice
}

/**
 * Reduce inventory when order is confirmed
 * Validates stock availability before reducing
 * @param {String} orderId - Sales order ID
 * @param {Boolean} isRegistered - Whether stock is registered
 * @returns {Promise<void>}
 */
export async function reduceInventoryForOrder(orderId, isRegistered = true) {
  const salesOrder = await SalesOrder.findById(orderId).populate('lines.item_id')

  if (!salesOrder) {
    throw new Error('Sales order not found')
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // First, validate stock availability for all items
    const insufficientStockItems = []

    for (const line of salesOrder.lines) {
      const item = await Item.findById(line.item_id).session(session)

      if (!item) {
        throw new Error(`Item not found: ${line.item_id}`)
      }

      // Check if item is active
      if (!item.is_active) {
        throw new Error(`Item ${item.item_name} is not active`)
      }

      // Check stock availability
      const availableStock = item.current_stock || 0
      if (availableStock < line.quantity) {
        insufficientStockItems.push({
          item_name: item.item_name,
          item_code: item.item_code,
          available: availableStock,
          requested: line.quantity,
          shortage: line.quantity - availableStock,
        })
      }
    }

    // If any items have insufficient stock, abort
    if (insufficientStockItems.length > 0) {
      const errorMessages = insufficientStockItems.map(
        (item) =>
          `${item.item_name} (${item.item_code}): Available ${item.available}, Requested ${item.requested}, Short ${item.shortage}`
      )
      throw new Error(
        `Insufficient stock for the following items:\n${errorMessages.join('\n')}`
      )
    }

    // All items have sufficient stock, proceed with reduction
    for (const line of salesOrder.lines) {
      const item = await Item.findById(line.item_id).session(session)

      // Reduce stock
      await item.updateStock(line.quantity, 0, isRegistered, false)
    }

    await session.commitTransaction()
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Get sales order summary
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>}
 */
export async function getSalesOrderSummary(startDate, endDate) {
  const summary = await SalesOrder.getSalesSummary(startDate, endDate)

  // Get count by status
  const statusCounts = await SalesOrder.aggregate([
    {
      $match: {
        order_date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ])

  const statusMap = {}
  statusCounts.forEach((item) => {
    statusMap[item._id] = item.count
  })

  return {
    ...summary,
    status_breakdown: statusMap,
  }
}

/**
 * Get top selling items
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Number} limit - Number of items to return
 * @returns {Promise<Array>}
 */
export async function getTopSellingItems(startDate, endDate, limit = 10) {
  const pipeline = [
    {
      $match: {
        order_date: { $gte: startDate, $lte: endDate },
        status: { $nin: ['Draft', 'Cancelled'] },
      },
    },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.item_id',
        total_quantity: { $sum: '$lines.quantity' },
        total_amount: { $sum: '$lines.line_total' },
        order_count: { $sum: 1 },
      },
    },
    { $sort: { total_amount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'items',
        localField: '_id',
        foreignField: '_id',
        as: 'item',
      },
    },
    { $unwind: '$item' },
    {
      $project: {
        item_code: '$item.item_code',
        item_name: '$item.item_name',
        total_quantity: 1,
        total_amount: 1,
        order_count: 1,
      },
    },
  ]

  return SalesOrder.aggregate(pipeline)
}

/**
 * Get top customers
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Number} limit - Number of customers to return
 * @returns {Promise<Array>}
 */
export async function getTopCustomers(startDate, endDate, limit = 10) {
  const pipeline = [
    {
      $match: {
        order_date: { $gte: startDate, $lte: endDate },
        status: { $nin: ['Draft', 'Cancelled'] },
      },
    },
    {
      $group: {
        _id: '$customer_id',
        customer_name: { $first: '$customer_name' },
        customer_code: { $first: '$customer_code' },
        total_orders: { $sum: 1 },
        total_amount: { $sum: '$grand_total' },
      },
    },
    { $sort: { total_amount: -1 } },
    { $limit: limit },
  ]

  return SalesOrder.aggregate(pipeline)
}

/**
 * Get sales by period (daily, weekly, monthly)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {String} period - Period type (day, week, month)
 * @returns {Promise<Array>}
 */
export async function getSalesByPeriod(startDate, endDate, period = 'day') {
  const groupFormat = {
    day: { $dateToString: { format: '%Y-%m-%d', date: '$order_date' } },
    week: { $week: '$order_date' },
    month: { $dateToString: { format: '%Y-%m', date: '$order_date' } },
  }

  const pipeline = [
    {
      $match: {
        order_date: { $gte: startDate, $lte: endDate },
        status: { $nin: ['Draft', 'Cancelled'] },
      },
    },
    {
      $group: {
        _id: groupFormat[period] || groupFormat.day,
        total_orders: { $sum: 1 },
        total_amount: { $sum: '$grand_total' },
        total_tax: { $sum: '$total_tax' },
      },
    },
    { $sort: { _id: 1 } },
  ]

  return SalesOrder.aggregate(pipeline)
}
