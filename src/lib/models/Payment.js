/**
 * Payment Model
 * Manages payment transactions for sales and purchases
 */

import mongoose from 'mongoose'

const PaymentSchema = new mongoose.Schema(
  {
    payment_no: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    payment_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    // Payment Type
    payment_type: {
      type: String,
      enum: ['Receipt', 'Payment'], // Receipt = from customer, Payment = to vendor
      required: true,
      index: true,
    },

    // Party Information (Customer or Vendor)
    party_type: {
      type: String,
      enum: ['Customer', 'Vendor'],
      required: true,
    },
    party_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'party_type',
      index: true,
    },
    party_name: {
      type: String,
      required: true,
    },
    party_code: {
      type: String,
      required: true,
    },

    // Payment Amount
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Payment amount must be greater than 0'],
    },

    // Payment Method
    payment_method: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card', 'Online Payment'],
      required: true,
    },

    // Bank Details (if applicable)
    bank_name: {
      type: String,
      trim: true,
    },
    cheque_no: {
      type: String,
      trim: true,
    },
    transaction_ref: {
      type: String,
      trim: true,
    },

    // Reference to Invoice (if paying against single invoice - legacy)
    invoice_type: {
      type: String,
      enum: ['SalesInvoice', 'PurchaseInvoice'],
    },
    invoice_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'invoice_type',
      index: true,
    },
    invoice_no: {
      type: String,
    },

    // Payment Allocations (supports multiple invoices)
    allocations: [
      {
        invoice_type: {
          type: String,
          enum: ['SalesInvoice', 'PurchaseInvoice'],
          required: true,
        },
        invoice_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'allocations.invoice_type',
        },
        invoice_no: {
          type: String,
          required: true,
        },
        allocated_amount: {
          type: Number,
          required: true,
          min: [0.01, 'Allocated amount must be greater than 0'],
        },
        allocation_date: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Unallocated amount (advance payment)
    unallocated_amount: {
      type: Number,
      default: 0,
      min: [0, 'Unallocated amount cannot be negative'],
    },

    // Cash/Bank Account
    account_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ['Draft', 'Posted', 'Reconciled', 'Cancelled'],
      default: 'Draft',
      index: true,
    },

    // Posting
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
PaymentSchema.index({ payment_date: -1 })
PaymentSchema.index({ party_id: 1, payment_date: -1 })
PaymentSchema.index({ payment_type: 1, status: 1 })
PaymentSchema.index({ posted: 1 })
PaymentSchema.index({ createdAt: -1 })

// Virtual: Is editable
PaymentSchema.virtual('is_editable').get(function () {
  return this.status === 'Draft' && !this.posted
})

// Virtual: Can be posted
PaymentSchema.virtual('can_be_posted').get(function () {
  return this.status === 'Draft' && !this.posted
})

// Virtual: Can be cancelled
PaymentSchema.virtual('can_be_cancelled').get(function () {
  return this.status !== 'Cancelled' && !this.posted
})

// Virtual: Total allocated amount
PaymentSchema.virtual('total_allocated').get(function () {
  if (!this.allocations || this.allocations.length === 0) return 0
  return this.allocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0)
})

// Virtual: Calculated unallocated amount
PaymentSchema.virtual('calculated_unallocated').get(function () {
  const allocated = this.total_allocated
  return this.amount - allocated
})

// Virtual: Is fully allocated
PaymentSchema.virtual('is_fully_allocated').get(function () {
  return this.calculated_unallocated <= 0.01 // Allow for rounding errors
})

// Virtual: Is advance payment (no allocations)
PaymentSchema.virtual('is_advance').get(function () {
  return !this.allocations || this.allocations.length === 0
})

// Auto-generate payment number
PaymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.payment_no) {
    const year = new Date(this.payment_date).getFullYear()
    const prefix = this.payment_type === 'Receipt' ? 'RCP' : 'PAY'

    const count = await this.constructor.countDocuments({
      payment_date: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
      payment_type: this.payment_type,
    })

    this.payment_no = `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`
  }
  next()
})

// Prevent editing if posted
PaymentSchema.pre('save', function (next) {
  if (!this.isNew && this.isModified() && this.posted) {
    const modifiedPaths = this.modifiedPaths()
    const allowedPaths = [
      'status',
      'cancelled_by',
      'cancelled_at',
      'cancellation_reason',
    ]

    const hasUnallowedChanges = modifiedPaths.some(
      (path) => !allowedPaths.some((allowed) => path.startsWith(allowed))
    )

    if (hasUnallowedChanges) {
      return next(new Error('Cannot modify posted payment'))
    }
  }
  next()
})

// Instance method: Post payment
PaymentSchema.methods.postPayment = async function (userId) {
  if (!this.can_be_posted) {
    throw new Error(`Cannot post payment in ${this.status} status`)
  }

  this.posted = true
  this.posted_by = userId
  this.posted_at = new Date()
  this.status = 'Posted'

  return this.save()
}

// Instance method: Cancel payment
PaymentSchema.methods.cancelPayment = async function (userId, reason) {
  if (!this.can_be_cancelled) {
    throw new Error('Cannot cancel posted payment')
  }

  this.status = 'Cancelled'
  this.cancelled_by = userId
  this.cancelled_at = new Date()
  this.cancellation_reason = reason

  return this.save()
}

// Static method: Find unposted payments
PaymentSchema.statics.findUnposted = async function () {
  return this.find({
    status: 'Draft',
    posted: false,
  }).sort({ payment_date: -1 })
}

// Static method: Get payment summary
PaymentSchema.statics.getPaymentSummary = async function (startDate, endDate, paymentType = null) {
  const match = {
    payment_date: { $gte: startDate, $lte: endDate },
    posted: true,
    status: { $ne: 'Cancelled' },
  }

  if (paymentType) {
    match.payment_type = paymentType
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$payment_type',
        total_count: { $sum: 1 },
        total_amount: { $sum: '$amount' },
      },
    },
  ]

  const result = await this.aggregate(pipeline)

  const summary = {
    receipts: { count: 0, amount: 0 },
    payments: { count: 0, amount: 0 },
    net_cashflow: 0,
  }

  result.forEach((item) => {
    if (item._id === 'Receipt') {
      summary.receipts = { count: item.total_count, amount: item.total_amount }
    } else if (item._id === 'Payment') {
      summary.payments = { count: item.total_count, amount: item.total_amount }
    }
  })

  summary.net_cashflow = summary.receipts.amount - summary.payments.amount

  return summary
}

// Static method: Find payments by party
PaymentSchema.statics.findByParty = async function (partyId, partyType) {
  return this.find({
    party_id: partyId,
    party_type: partyType,
    status: { $ne: 'Cancelled' },
  })
    .populate('invoice_id')
    .populate('account_id', 'account_code account_name')
    .sort({ payment_date: -1 })
}

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema)

export default Payment
