/**
 * Purchase Order Model
 * Manages purchase orders with workflow states
 */

import mongoose from 'mongoose'

const PurchaseOrderItemSchema = new mongoose.Schema({
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

const PurchaseOrderSchema = new mongoose.Schema({
  // Order Details
  order_number: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  order_date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
  expected_delivery_date: {
    type: Date,
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

  // Items
  items: {
    type: [PurchaseOrderItemSchema],
    required: true,
    validate: [
      {
        validator: function(items) {
          return items && items.length > 0
        },
        message: 'Order must have at least one item',
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

  // Workflow Status
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Approved', 'Sent to Vendor', 'Partially Received', 'Received', 'Cancelled'],
    default: 'Draft',
    index: true,
  },

  // Additional Information
  notes: {
    type: String,
  },
  terms_and_conditions: {
    type: String,
  },

  // Bill Creation Tracking
  bills_created: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PurchaseInvoice',
  }],
  received_quantity: {
    type: Number,
    default: 0,
  },

  // Metadata
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approved_at: {
    type: Date,
  },
}, {
  timestamps: true,
})

// Indexes
PurchaseOrderSchema.index({ vendor_id: 1, order_date: -1 })
PurchaseOrderSchema.index({ status: 1, order_date: -1 })
PurchaseOrderSchema.index({ created_by: 1, order_date: -1 })

// Virtual: Is Editable
PurchaseOrderSchema.virtual('is_editable').get(function() {
  return this.status === 'Draft' || this.status === 'Pending Approval'
})

// Virtual: Total Items
PurchaseOrderSchema.virtual('total_items').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0)
})

// Virtual: Can be approved
PurchaseOrderSchema.virtual('can_approve').get(function() {
  return this.status === 'Pending Approval'
})

// Virtual: Can create bill
PurchaseOrderSchema.virtual('can_create_bill').get(function() {
  return this.status === 'Approved' || this.status === 'Sent to Vendor' || this.status === 'Partially Received'
})

// Pre-save: Calculate totals
PurchaseOrderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0)
    this.total_tax = this.items.reduce((sum, item) => sum + item.tax_amount, 0)
    this.total_amount = this.subtotal + this.total_tax
  }
  next()
})

// Pre-save: Prevent editing if not in draft
PurchaseOrderSchema.pre('save', function(next) {
  if (!this.isNew && !this.is_editable && this.isModified()) {
    const allowedPaths = ['status', 'approved_by', 'approved_at', 'bills_created', 'received_quantity']
    const modifiedPaths = this.modifiedPaths()
    const hasUnallowedChanges = modifiedPaths.some(
      path => !allowedPaths.some(allowed => path.startsWith(allowed))
    )

    if (hasUnallowedChanges) {
      return next(new Error('Cannot modify purchase order that is not in draft or pending approval'))
    }
  }
  next()
})

// Instance Methods
PurchaseOrderSchema.methods.submitForApproval = async function() {
  if (this.status !== 'Draft') {
    throw new Error('Only draft orders can be submitted for approval')
  }
  this.status = 'Pending Approval'
  return this.save()
}

PurchaseOrderSchema.methods.approve = async function(userId) {
  if (this.status !== 'Pending Approval') {
    throw new Error('Only pending orders can be approved')
  }
  this.status = 'Approved'
  this.approved_by = userId
  this.approved_at = new Date()
  return this.save()
}

PurchaseOrderSchema.methods.sendToVendor = async function() {
  if (this.status !== 'Approved') {
    throw new Error('Only approved orders can be sent to vendor')
  }
  this.status = 'Sent to Vendor'
  return this.save()
}

PurchaseOrderSchema.methods.markReceived = async function(receivedQty) {
  if (!['Sent to Vendor', 'Partially Received'].includes(this.status)) {
    throw new Error('Order must be sent to vendor before marking as received')
  }

  this.received_quantity += receivedQty
  const totalQty = this.items.reduce((sum, item) => sum + item.quantity, 0)

  if (this.received_quantity >= totalQty) {
    this.status = 'Received'
  } else {
    this.status = 'Partially Received'
  }

  return this.save()
}

PurchaseOrderSchema.methods.cancelOrder = async function() {
  if (['Received', 'Cancelled'].includes(this.status)) {
    throw new Error('Cannot cancel received or already cancelled order')
  }
  this.status = 'Cancelled'
  return this.save()
}

// Static Methods
PurchaseOrderSchema.statics.generateOrderNumber = async function() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  const prefix = `PO${year}${month}`

  const lastOrder = await this.findOne({
    order_number: new RegExp(`^${prefix}`)
  }).sort({ order_number: -1 })

  let nextNum = 1
  if (lastOrder) {
    const lastNum = parseInt(lastOrder.order_number.slice(-4))
    nextNum = lastNum + 1
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`
}

PurchaseOrderSchema.statics.getOrdersByVendor = async function(vendorId, startDate, endDate) {
  const query = { vendor_id: vendorId }

  if (startDate || endDate) {
    query.order_date = {}
    if (startDate) query.order_date.$gte = new Date(startDate)
    if (endDate) query.order_date.$lte = new Date(endDate)
  }

  return this.find(query)
    .populate('vendor_id', 'name contact_person')
    .populate('items.item_id', 'name sku')
    .sort({ order_date: -1 })
}

export default mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', PurchaseOrderSchema)
