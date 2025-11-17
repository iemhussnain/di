/**
 * Sales Order Model
 * Manages sales orders with line items and workflow
 */

import mongoose from 'mongoose'

// Sales Order Line Schema (embedded)
const SalesOrderLineSchema = new mongoose.Schema(
  {
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.01, 'Quantity must be greater than 0'],
    },
    unit_price: {
      type: Number,
      required: true,
      min: [0, 'Unit price cannot be negative'],
    },
    discount_percentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount percentage cannot be negative'],
      max: [100, 'Discount percentage cannot exceed 100'],
    },
    discount_amount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative'],
    },
    tax_percentage: {
      type: Number,
      default: 0,
      min: [0, 'Tax percentage cannot be negative'],
      max: [100, 'Tax percentage cannot exceed 100'],
    },
    tax_amount: {
      type: Number,
      default: 0,
      min: [0, 'Tax amount cannot be negative'],
    },
    line_total: {
      type: Number,
      default: 0,
      min: [0, 'Line total cannot be negative'],
    },
    // Tracking delivered quantity
    delivered_qty: {
      type: Number,
      default: 0,
      min: [0, 'Delivered quantity cannot be negative'],
    },
  },
  { _id: true }
)

// Sales Order Schema
const SalesOrderSchema = new mongoose.Schema(
  {
    order_no: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    order_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    customer_name: {
      type: String,
      required: true,
    },
    customer_code: {
      type: String,
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ['Draft', 'Confirmed', 'Invoiced', 'Partially Delivered', 'Delivered', 'Cancelled'],
      default: 'Draft',
      index: true,
    },

    // Delivery Information
    expected_delivery_date: {
      type: Date,
    },
    actual_delivery_date: {
      type: Date,
    },
    shipping_address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
      country: { type: String, default: 'Pakistan', trim: true },
      postal_code: { type: String, trim: true },
    },

    // Payment Terms
    payment_terms: {
      type: String,
      enum: ['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90'],
      default: 'Cash',
    },

    // Line Items
    lines: {
      type: [SalesOrderLineSchema],
      validate: {
        validator: function (lines) {
          return lines && lines.length > 0
        },
        message: 'Sales order must have at least one line item',
      },
    },

    // Totals
    subtotal: {
      type: Number,
      default: 0,
      min: [0, 'Subtotal cannot be negative'],
    },
    total_discount: {
      type: Number,
      default: 0,
      min: [0, 'Total discount cannot be negative'],
    },
    total_tax: {
      type: Number,
      default: 0,
      min: [0, 'Total tax cannot be negative'],
    },
    grand_total: {
      type: Number,
      default: 0,
      min: [0, 'Grand total cannot be negative'],
    },

    // References
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesInvoice',
    },
    reference_no: {
      type: String,
      trim: true,
    },

    // Notes
    notes: {
      type: String,
      trim: true,
    },
    internal_notes: {
      type: String,
      trim: true,
    },

    // Workflow tracking
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    confirmed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    confirmed_at: {
      type: Date,
    },
    invoiced_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    invoiced_at: {
      type: Date,
    },
    delivered_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    delivered_at: {
      type: Date,
    },
    cancelled_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    cancelled_at: {
      type: Date,
    },
    cancellation_reason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
SalesOrderSchema.index({ order_date: -1 })
SalesOrderSchema.index({ customer_id: 1, order_date: -1 })
SalesOrderSchema.index({ status: 1, order_date: -1 })
SalesOrderSchema.index({ createdAt: -1 })

// Virtual: Is editable
SalesOrderSchema.virtual('is_editable').get(function () {
  return this.status === 'Draft'
})

// Virtual: Can be confirmed
SalesOrderSchema.virtual('can_be_confirmed').get(function () {
  return this.status === 'Draft' && this.lines.length > 0
})

// Virtual: Can be invoiced
SalesOrderSchema.virtual('can_be_invoiced').get(function () {
  return this.status === 'Confirmed' && !this.invoice_id
})

// Virtual: Can be delivered
SalesOrderSchema.virtual('can_be_delivered').get(function () {
  return this.status === 'Confirmed' || this.status === 'Invoiced' || this.status === 'Partially Delivered'
})

// Virtual: Can be cancelled
SalesOrderSchema.virtual('can_be_cancelled').get(function () {
  return this.status === 'Draft' || this.status === 'Confirmed'
})

// Virtual: Full shipping address
SalesOrderSchema.virtual('full_shipping_address').get(function () {
  if (!this.shipping_address) return 'N/A'
  const parts = []
  if (this.shipping_address.street) parts.push(this.shipping_address.street)
  if (this.shipping_address.city) parts.push(this.shipping_address.city)
  if (this.shipping_address.province) parts.push(this.shipping_address.province)
  if (this.shipping_address.postal_code) parts.push(this.shipping_address.postal_code)
  if (this.shipping_address.country) parts.push(this.shipping_address.country)
  return parts.join(', ') || 'N/A'
})

// Auto-generate order number
SalesOrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.order_no) {
    const year = new Date(this.order_date).getFullYear()
    const count = await this.constructor.countDocuments({
      order_date: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    })
    this.order_no = `SO-${year}-${(count + 1).toString().padStart(4, '0')}`
  }
  next()
})

// Calculate line totals before saving
SalesOrderSchema.pre('save', function (next) {
  if (this.lines && this.lines.length > 0) {
    let subtotal = 0
    let totalDiscount = 0
    let totalTax = 0

    for (const line of this.lines) {
      // Calculate line subtotal
      const lineSubtotal = line.quantity * line.unit_price

      // Calculate discount
      if (line.discount_percentage > 0) {
        line.discount_amount = (lineSubtotal * line.discount_percentage) / 100
      }

      // Calculate amount after discount
      const amountAfterDiscount = lineSubtotal - line.discount_amount

      // Calculate tax
      if (line.tax_percentage > 0) {
        line.tax_amount = (amountAfterDiscount * line.tax_percentage) / 100
      }

      // Calculate line total
      line.line_total = amountAfterDiscount + line.tax_amount

      // Accumulate totals
      subtotal += lineSubtotal
      totalDiscount += line.discount_amount
      totalTax += line.tax_amount
    }

    // Round to 2 decimal places
    this.subtotal = Math.round(subtotal * 100) / 100
    this.total_discount = Math.round(totalDiscount * 100) / 100
    this.total_tax = Math.round(totalTax * 100) / 100
    this.grand_total = Math.round((subtotal - totalDiscount + totalTax) * 100) / 100
  }

  next()
})

// Prevent editing if not in Draft status
SalesOrderSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified() && !this.is_editable) {
    // Allow status changes and workflow field updates
    const modifiedPaths = this.modifiedPaths()
    const allowedPaths = [
      'status',
      'confirmed_by',
      'confirmed_at',
      'invoiced_by',
      'invoiced_at',
      'delivered_by',
      'delivered_at',
      'cancelled_by',
      'cancelled_at',
      'cancellation_reason',
      'invoice_id',
      'actual_delivery_date',
      'lines.$[].delivered_qty',
    ]

    const hasUnallowedChanges = modifiedPaths.some(
      (path) => !allowedPaths.some((allowed) => path.startsWith(allowed))
    )

    if (hasUnallowedChanges) {
      return next(
        new Error(`Cannot modify sales order in ${this.status} status. Only Draft orders can be edited.`)
      )
    }
  }
  next()
})

// Instance method: Confirm order
SalesOrderSchema.methods.confirmOrder = async function (userId) {
  if (!this.can_be_confirmed) {
    throw new Error(`Cannot confirm order in ${this.status} status`)
  }

  this.status = 'Confirmed'
  this.confirmed_by = userId
  this.confirmed_at = new Date()

  return this.save()
}

// Instance method: Cancel order
SalesOrderSchema.methods.cancelOrder = async function (userId, reason) {
  if (!this.can_be_cancelled) {
    throw new Error(`Cannot cancel order in ${this.status} status`)
  }

  this.status = 'Cancelled'
  this.cancelled_by = userId
  this.cancelled_at = new Date()
  this.cancellation_reason = reason

  return this.save()
}

// Instance method: Mark as invoiced
SalesOrderSchema.methods.markAsInvoiced = async function (invoiceId, userId) {
  if (!this.can_be_invoiced) {
    throw new Error(`Cannot invoice order in ${this.status} status`)
  }

  this.status = 'Invoiced'
  this.invoice_id = invoiceId
  this.invoiced_by = userId
  this.invoiced_at = new Date()

  return this.save()
}

// Instance method: Update delivery status
SalesOrderSchema.methods.updateDeliveryStatus = async function (lineUpdates, userId) {
  let fullyDelivered = true
  let partiallyDelivered = false

  for (const update of lineUpdates) {
    const line = this.lines.id(update.lineId)
    if (line) {
      line.delivered_qty = update.delivered_qty

      if (line.delivered_qty < line.quantity) {
        fullyDelivered = false
      }
      if (line.delivered_qty > 0) {
        partiallyDelivered = true
      }
    }
  }

  if (fullyDelivered) {
    this.status = 'Delivered'
    this.delivered_by = userId
    this.delivered_at = new Date()
    this.actual_delivery_date = new Date()
  } else if (partiallyDelivered) {
    this.status = 'Partially Delivered'
  }

  return this.save()
}

// Static method: Find pending orders
SalesOrderSchema.statics.findPending = async function () {
  return this.find({
    status: { $in: ['Draft', 'Confirmed'] },
  })
    .populate('customer_id', 'customer_code customer_name')
    .sort({ order_date: -1 })
}

// Static method: Find overdue orders
SalesOrderSchema.statics.findOverdue = async function () {
  return this.find({
    status: { $in: ['Confirmed', 'Invoiced', 'Partially Delivered'] },
    expected_delivery_date: { $lt: new Date() },
  })
    .populate('customer_id', 'customer_code customer_name')
    .sort({ expected_delivery_date: 1 })
}

// Static method: Get sales summary
SalesOrderSchema.statics.getSalesSummary = async function (startDate, endDate) {
  const pipeline = [
    {
      $match: {
        order_date: { $gte: startDate, $lte: endDate },
        status: { $nin: ['Draft', 'Cancelled'] },
      },
    },
    {
      $group: {
        _id: null,
        total_orders: { $sum: 1 },
        total_amount: { $sum: '$grand_total' },
        total_tax: { $sum: '$total_tax' },
        avg_order_value: { $avg: '$grand_total' },
      },
    },
  ]

  const result = await this.aggregate(pipeline)
  return result[0] || { total_orders: 0, total_amount: 0, total_tax: 0, avg_order_value: 0 }
}

const SalesOrder = mongoose.models.SalesOrder || mongoose.model('SalesOrder', SalesOrderSchema)

export default SalesOrder
