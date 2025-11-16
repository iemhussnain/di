/**
 * Customer Model
 * Manages customer/client information for sales
 */

import mongoose from 'mongoose'

const CustomerSchema = new mongoose.Schema(
  {
    customer_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    customer_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Registration Status
    is_registered: {
      type: Boolean,
      default: false,
    },
    ntn: {
      type: String,
      sparse: true,
      trim: true,
    },
    strn: {
      type: String,
      sparse: true,
      trim: true,
    },

    // Contact Information
    cnic: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Address
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
      country: { type: String, default: 'Pakistan', trim: true },
      postal_code: { type: String, trim: true },
    },

    // Business Details
    credit_limit: {
      type: Number,
      default: 0,
      min: 0,
    },
    payment_terms: {
      type: String,
      enum: ['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90'],
      default: 'Cash',
    },

    // Balances
    opening_balance: {
      type: Number,
      default: 0,
    },
    current_balance: {
      type: Number,
      default: 0,
    },

    // Status
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Blocked'],
      default: 'Active',
    },

    // Notes
    notes: {
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
CustomerSchema.index({ customer_name: 1 })
CustomerSchema.index({ is_registered: 1 })
CustomerSchema.index({ status: 1 })
CustomerSchema.index({ 'address.city': 1 })

// Virtual: Full Address
CustomerSchema.virtual('full_address').get(function () {
  const parts = []
  if (this.address?.street) parts.push(this.address.street)
  if (this.address?.city) parts.push(this.address.city)
  if (this.address?.province) parts.push(this.address.province)
  if (this.address?.postal_code) parts.push(this.address.postal_code)
  if (this.address?.country) parts.push(this.address.country)
  return parts.join(', ') || 'N/A'
})

// Virtual: Outstanding Balance (negative means customer owes us)
CustomerSchema.virtual('outstanding_balance').get(function () {
  return -this.current_balance
})

// Virtual: Is Credit Limit Exceeded
CustomerSchema.virtual('is_credit_limit_exceeded').get(function () {
  return this.outstanding_balance > this.credit_limit
})

// Auto-generate customer code
CustomerSchema.pre('save', async function (next) {
  if (this.isNew && !this.customer_code) {
    const count = await this.constructor.countDocuments()
    this.customer_code = `CUST-${(count + 1).toString().padStart(5, '0')}`
  }
  next()
})

// Validate NTN/STRN when registered
CustomerSchema.pre('save', function (next) {
  if (this.is_registered) {
    if (!this.ntn && !this.strn) {
      return next(new Error('Registered customers must have either NTN or STRN'))
    }
  }
  next()
})

// Instance method: Update balance
CustomerSchema.methods.updateBalance = async function (amount, isIncrease = true) {
  if (isIncrease) {
    this.current_balance += amount
  } else {
    this.current_balance -= amount
  }
  return this.save()
}

// Instance method: Check if customer can make purchase
CustomerSchema.methods.canPurchase = function (amount) {
  if (this.status !== 'Active') {
    return { allowed: false, reason: `Customer is ${this.status}` }
  }

  const newBalance = this.outstanding_balance + amount
  if (newBalance > this.credit_limit) {
    return {
      allowed: false,
      reason: `Credit limit exceeded. Limit: ${this.credit_limit}, Outstanding: ${this.outstanding_balance}, Requested: ${amount}`,
    }
  }

  return { allowed: true }
}

// Static method: Find customers with outstanding balance
CustomerSchema.statics.findWithOutstanding = async function (minAmount = 0) {
  return this.find({
    current_balance: { $lt: -minAmount },
    status: 'Active',
  }).sort({ current_balance: 1 })
}

// Static method: Find customers exceeding credit limit
CustomerSchema.statics.findCreditLimitExceeded = async function () {
  const customers = await this.find({ status: 'Active' })
  return customers.filter((customer) => customer.is_credit_limit_exceeded)
}

const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema)

export default Customer
