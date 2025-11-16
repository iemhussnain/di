/**
 * Vendor Model
 * Manages supplier/vendor information for the ERP system
 */

import mongoose from 'mongoose'

const VendorSchema = new mongoose.Schema(
  {
    vendor_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    vendor_name: {
      type: String,
      required: true,
      trim: true,
    },
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
    address: {
      street: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        trim: true,
      },
      province: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: 'Pakistan',
        trim: true,
      },
      postal_code: {
        type: String,
        trim: true,
      },
    },
    payment_terms: {
      type: String,
      enum: ['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90'],
      default: 'Cash',
    },
    opening_balance: {
      type: Number,
      default: 0,
    },
    current_balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Blocked'],
      default: 'Active',
    },
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

// Auto-generate vendor code before saving
VendorSchema.pre('save', async function (next) {
  if (this.isNew && !this.vendor_code) {
    const count = await this.constructor.countDocuments()
    this.vendor_code = `VEN-${(count + 1).toString().padStart(5, '0')}`
  }
  next()
})

// Virtual: Payable Amount (positive means we owe the vendor)
VendorSchema.virtual('payable_amount').get(function () {
  return this.current_balance
})

// Virtual: Is payment overdue (placeholder - will be implemented with actual transactions)
VendorSchema.virtual('has_overdue_payment').get(function () {
  return false // Will be calculated based on actual invoice due dates
})

// Instance method: Check if vendor is active
VendorSchema.methods.isActive = function () {
  return this.status === 'Active'
}

// Instance method: Update balance
VendorSchema.methods.updateBalance = function (amount) {
  this.current_balance += amount
  return this.save()
}

// Static method: Find active vendors
VendorSchema.statics.findActive = function () {
  return this.find({ status: 'Active' })
}

// Static method: Find registered vendors
VendorSchema.statics.findRegistered = function () {
  return this.find({ is_registered: true })
}

const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema)

export default Vendor
