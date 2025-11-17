/**
 * Sales Invoice Model
 * Manages sales invoices with payment tracking
 */

import mongoose from 'mongoose'

// Sales Invoice Line Schema (embedded)
const SalesInvoiceLineSchema = new mongoose.Schema(
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
  },
  { _id: true }
)

// Sales Invoice Schema
const SalesInvoiceSchema = new mongoose.Schema(
  {
    invoice_no: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    invoice_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    due_date: {
      type: Date,
      required: true,
    },

    // Customer Information
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
    customer_ntn: {
      type: String,
    },
    customer_strn: {
      type: String,
    },

    // Reference to Sales Order
    sales_order_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
    },
    sales_order_no: {
      type: String,
    },

    // Status
    status: {
      type: String,
      enum: ['Draft', 'Posted', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled'],
      default: 'Draft',
      index: true,
    },

    // Payment Terms
    payment_terms: {
      type: String,
      enum: ['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90'],
      default: 'Cash',
    },

    // Line Items
    lines: {
      type: [SalesInvoiceLineSchema],
      validate: {
        validator: function (lines) {
          return lines && lines.length > 0
        },
        message: 'Invoice must have at least one line item',
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

    // Payment Tracking
    amount_paid: {
      type: Number,
      default: 0,
      min: [0, 'Amount paid cannot be negative'],
    },
    amount_due: {
      type: Number,
      default: 0,
      min: [0, 'Amount due cannot be negative'],
    },

    // Posting status
    posted: {
      type: Boolean,
      default: false,
      index: true,
    },
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    posted_at: {
      type: Date,
    },

    // Journal Entry Reference
    journal_entry_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
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
SalesInvoiceSchema.index({ invoice_date: -1 })
SalesInvoiceSchema.index({ customer_id: 1, invoice_date: -1 })
SalesInvoiceSchema.index({ status: 1, invoice_date: -1 })
SalesInvoiceSchema.index({ due_date: 1, status: 1 })
SalesInvoiceSchema.index({ posted: 1 })
SalesInvoiceSchema.index({ createdAt: -1 })

// Virtual: Is editable
SalesInvoiceSchema.virtual('is_editable').get(function () {
  return this.status === 'Draft' && !this.posted
})

// Virtual: Can be posted
SalesInvoiceSchema.virtual('can_be_posted').get(function () {
  return this.status === 'Draft' && !this.posted && this.lines.length > 0
})

// Virtual: Is overdue
SalesInvoiceSchema.virtual('is_overdue').get(function () {
  return (
    this.posted &&
    this.status !== 'Fully Paid' &&
    this.status !== 'Cancelled' &&
    new Date() > this.due_date
  )
})

// Virtual: Can receive payment
SalesInvoiceSchema.virtual('can_receive_payment').get(function () {
  return this.posted && this.amount_due > 0 && this.status !== 'Cancelled'
})

// Virtual: Payment percentage
SalesInvoiceSchema.virtual('payment_percentage').get(function () {
  if (this.grand_total === 0) return 0
  return (this.amount_paid / this.grand_total) * 100
})

// Auto-generate invoice number
SalesInvoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoice_no) {
    const year = new Date(this.invoice_date).getFullYear()
    const count = await this.constructor.countDocuments({
      invoice_date: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    })
    this.invoice_no = `INV-${year}-${(count + 1).toString().padStart(4, '0')}`
  }
  next()
})

// Calculate line totals and due amount before saving
SalesInvoiceSchema.pre('save', function (next) {
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

  // Calculate amount due
  this.amount_due = Math.round((this.grand_total - this.amount_paid) * 100) / 100

  next()
})

// Update status based on payment
SalesInvoiceSchema.pre('save', function (next) {
  if (this.posted && this.status !== 'Cancelled') {
    if (this.amount_due <= 0) {
      this.status = 'Fully Paid'
    } else if (this.amount_paid > 0) {
      this.status = 'Partially Paid'
    } else if (this.is_overdue) {
      this.status = 'Overdue'
    } else if (this.status === 'Draft') {
      this.status = 'Posted'
    }
  }
  next()
})

// Prevent editing if posted
SalesInvoiceSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified() && this.posted) {
    // Allow payment and status field updates
    const modifiedPaths = this.modifiedPaths()
    const allowedPaths = [
      'status',
      'amount_paid',
      'amount_due',
      'cancelled_by',
      'cancelled_at',
      'cancellation_reason',
    ]

    const hasUnallowedChanges = modifiedPaths.some(
      (path) => !allowedPaths.some((allowed) => path.startsWith(allowed))
    )

    if (hasUnallowedChanges) {
      return next(new Error('Cannot modify posted invoice. Only payment updates are allowed.'))
    }
  }
  next()
})

// Instance method: Post invoice
SalesInvoiceSchema.methods.postInvoice = async function (userId) {
  if (!this.can_be_posted) {
    throw new Error(`Cannot post invoice in ${this.status} status`)
  }

  this.posted = true
  this.posted_by = userId
  this.posted_at = new Date()
  this.status = 'Posted'

  return this.save()
}

// Instance method: Record payment
SalesInvoiceSchema.methods.recordPayment = async function (amount) {
  if (!this.can_receive_payment) {
    throw new Error('Cannot receive payment for this invoice')
  }

  if (amount <= 0) {
    throw new Error('Payment amount must be greater than 0')
  }

  if (amount > this.amount_due) {
    throw new Error('Payment amount cannot exceed amount due')
  }

  this.amount_paid += amount
  this.amount_due -= amount

  return this.save()
}

// Instance method: Cancel invoice
SalesInvoiceSchema.methods.cancelInvoice = async function (userId, reason) {
  if (this.status === 'Cancelled') {
    throw new Error('Invoice is already cancelled')
  }

  if (this.amount_paid > 0) {
    throw new Error('Cannot cancel invoice with payments. Please reverse payments first.')
  }

  this.status = 'Cancelled'
  this.cancelled_by = userId
  this.cancelled_at = new Date()
  this.cancellation_reason = reason

  return this.save()
}

// Static method: Find overdue invoices
SalesInvoiceSchema.statics.findOverdue = async function () {
  return this.find({
    posted: true,
    status: { $in: ['Posted', 'Partially Paid', 'Overdue'] },
    due_date: { $lt: new Date() },
    amount_due: { $gt: 0 },
  })
    .populate('customer_id', 'customer_code customer_name')
    .sort({ due_date: 1 })
}

// Static method: Find unpaid invoices
SalesInvoiceSchema.statics.findUnpaid = async function () {
  return this.find({
    posted: true,
    status: { $nin: ['Fully Paid', 'Cancelled'] },
    amount_due: { $gt: 0 },
  })
    .populate('customer_id', 'customer_code customer_name')
    .sort({ invoice_date: -1 })
}

// Static method: Get revenue summary
SalesInvoiceSchema.statics.getRevenueSummary = async function (startDate, endDate) {
  const pipeline = [
    {
      $match: {
        invoice_date: { $gte: startDate, $lte: endDate },
        posted: true,
        status: { $ne: 'Cancelled' },
      },
    },
    {
      $group: {
        _id: null,
        total_invoices: { $sum: 1 },
        total_revenue: { $sum: '$grand_total' },
        total_paid: { $sum: '$amount_paid' },
        total_outstanding: { $sum: '$amount_due' },
        total_tax_collected: { $sum: '$total_tax' },
      },
    },
  ]

  const result = await this.aggregate(pipeline)
  return (
    result[0] || {
      total_invoices: 0,
      total_revenue: 0,
      total_paid: 0,
      total_outstanding: 0,
      total_tax_collected: 0,
    }
  )
}

const SalesInvoice =
  mongoose.models.SalesInvoice || mongoose.model('SalesInvoice', SalesInvoiceSchema)

export default SalesInvoice
