/**
 * Purchase Invoice (Bill) Model
 * Manages vendor bills and purchase invoices
 */

import mongoose from 'mongoose'

const PurchaseInvoiceItemSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.01, 'Quantity must be greater than 0'],
  },
  rate: {
    type: Number,
    required: true,
    min: [0, 'Rate cannot be negative'],
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative'],
  },
  tax_rate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  tax_amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false })

const PurchaseInvoiceSchema = new mongoose.Schema({
  // Invoice Details
  invoice_number: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  vendor_invoice_number: {
    type: String,
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

  // Vendor Information
  vendor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true,
  },
  vendor_name: {
    type: String,
    required: true,
  },

  // Reference to Purchase Order (optional)
  purchase_order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseOrder',
  },

  // Items
  items: {
    type: [PurchaseInvoiceItemSchema],
    required: true,
    validate: [
      {
        validator: function(items) {
          return items && items.length > 0
        },
        message: 'Invoice must have at least one item',
      },
    ],
  },

  // Financial Details
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  total_tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0,
  },

  // Payment Tracking
  amount_paid: {
    type: Number,
    default: 0,
    min: 0,
  },
  amount_due: {
    type: Number,
    required: true,
    min: 0,
  },
  payment_status: {
    type: String,
    enum: ['Unpaid', 'Partially Paid', 'Paid', 'Overdue'],
    default: 'Unpaid',
    index: true,
  },

  // Status
  status: {
    type: String,
    enum: ['Draft', 'Posted', 'Cancelled'],
    default: 'Draft',
    index: true,
  },
  posted: {
    type: Boolean,
    default: false,
    index: true,
  },
  posted_at: {
    type: Date,
  },

  // Journal Entry Reference
  journal_entry_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JournalEntry',
  },

  // Additional Information
  notes: {
    type: String,
  },

  // Metadata
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
})

// Indexes
PurchaseInvoiceSchema.index({ vendor_id: 1, invoice_date: -1 })
PurchaseInvoiceSchema.index({ status: 1, invoice_date: -1 })
PurchaseInvoiceSchema.index({ payment_status: 1, due_date: 1 })
PurchaseInvoiceSchema.index({ posted: 1, invoice_date: -1 })

// Virtual: Is Editable
PurchaseInvoiceSchema.virtual('is_editable').get(function() {
  return this.status === 'Draft' && !this.posted
})

// Virtual: Is Overdue
PurchaseInvoiceSchema.virtual('is_overdue').get(function() {
  return (
    this.status === 'Posted' &&
    this.payment_status !== 'Paid' &&
    new Date() > this.due_date
  )
})

// Virtual: Days Overdue
PurchaseInvoiceSchema.virtual('days_overdue').get(function() {
  if (!this.is_overdue) return 0
  const diffTime = Math.abs(new Date() - this.due_date)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Pre-save: Calculate totals and payment status
PurchaseInvoiceSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0)
    this.total_tax = this.items.reduce((sum, item) => sum + item.tax_amount, 0)
    this.total_amount = this.subtotal + this.total_tax
    this.amount_due = this.total_amount - this.amount_paid
  }

  if (this.isModified('amount_paid')) {
    this.amount_due = this.total_amount - this.amount_paid

    if (this.amount_paid === 0) {
      this.payment_status = 'Unpaid'
    } else if (this.amount_paid >= this.total_amount) {
      this.payment_status = 'Paid'
    } else {
      this.payment_status = 'Partially Paid'
    }

    // Check if overdue
    if (this.payment_status !== 'Paid' && new Date() > this.due_date) {
      this.payment_status = 'Overdue'
    }
  }

  next()
})

// Pre-save: Prevent editing if posted
PurchaseInvoiceSchema.pre('save', function(next) {
  if (!this.isNew && this.posted && this.isModified()) {
    const allowedPaths = ['amount_paid', 'payment_status', 'amount_due', 'status']
    const modifiedPaths = this.modifiedPaths()
    const hasUnallowedChanges = modifiedPaths.some(
      path => !allowedPaths.some(allowed => path.startsWith(allowed))
    )

    if (hasUnallowedChanges) {
      return next(new Error('Cannot modify posted invoice'))
    }
  }
  next()
})

// Instance Methods
PurchaseInvoiceSchema.methods.postInvoice = async function() {
  if (this.posted) {
    throw new Error('Invoice is already posted')
  }
  if (this.status === 'Cancelled') {
    throw new Error('Cannot post cancelled invoice')
  }

  this.status = 'Posted'
  this.posted = true
  this.posted_at = new Date()
  return this.save()
}

PurchaseInvoiceSchema.methods.recordPayment = async function(amount) {
  if (!this.posted) {
    throw new Error('Invoice must be posted before recording payment')
  }
  if (this.status === 'Cancelled') {
    throw new Error('Cannot record payment for cancelled invoice')
  }

  this.amount_paid += amount
  return this.save()
}

PurchaseInvoiceSchema.methods.cancelInvoice = async function() {
  if (this.posted) {
    throw new Error('Cannot cancel posted invoice. Reverse the journal entry instead.')
  }
  if (this.amount_paid > 0) {
    throw new Error('Cannot cancel invoice with payments recorded')
  }

  this.status = 'Cancelled'
  return this.save()
}

// Static Methods
PurchaseInvoiceSchema.statics.generateInvoiceNumber = async function() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  const prefix = `PINV${year}${month}`

  const lastInvoice = await this.findOne({
    invoice_number: new RegExp(`^${prefix}`)
  }).sort({ invoice_number: -1 })

  let nextNum = 1
  if (lastInvoice) {
    const lastNum = parseInt(lastInvoice.invoice_number.slice(-4))
    nextNum = lastNum + 1
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`
}

PurchaseInvoiceSchema.statics.getOverdueInvoices = async function() {
  return this.find({
    posted: true,
    payment_status: { $in: ['Unpaid', 'Partially Paid', 'Overdue'] },
    due_date: { $lt: new Date() },
  })
    .populate('vendor_id', 'name contact_person phone')
    .sort({ due_date: 1 })
}

PurchaseInvoiceSchema.statics.getInvoicesByVendor = async function(vendorId, startDate, endDate) {
  const query = { vendor_id: vendorId }

  if (startDate || endDate) {
    query.invoice_date = {}
    if (startDate) query.invoice_date.$gte = new Date(startDate)
    if (endDate) query.invoice_date.$lte = new Date(endDate)
  }

  return this.find(query)
    .populate('vendor_id', 'name contact_person')
    .populate('items.item_id', 'name sku')
    .sort({ invoice_date: -1 })
}

export default mongoose.models.PurchaseInvoice || mongoose.model('PurchaseInvoice', PurchaseInvoiceSchema)
