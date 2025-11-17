/**
 * User Model
 * Manages user authentication and authorization
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['Admin', 'Manager', 'Accountant', 'Sales', 'Inventory', 'User'],
      default: 'User',
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
    },
    last_login: {
      type: Date,
    },
    login_count: {
      type: Number,
      default: 0,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    email_verified_at: {
      type: Date,
    },
    password_reset_token: {
      type: String,
    },
    password_reset_expires: {
      type: Date,
    },
    two_factor_enabled: {
      type: Boolean,
      default: false,
    },
    two_factor_secret: {
      type: String,
      select: false,
    },
    // FBR Tax Information
    company_ntn: {
      type: String,
      match: [/^\d{7}$/, 'NTN must be 7 digits'],
    },
    company_strn: {
      type: String,
      match: [/^\d{2}-\d{2}-\d{4}-\d{3}-\d{2}$/, 'STRN format: 00-00-0000-000-00'],
    },
    company_ref_no: {
      type: String,
      match: [/^\d{7}-\d$/, 'Reference No format: 0000000-0'],
    },
    company_province: String,
    company_address: String,
    fbr_sandbox_token: {
      type: String,
      select: false,
    },
    fbr_production_token: {
      type: String,
      select: false,
    },
    fbr_registration_status: {
      type: String,
      enum: ['Active', 'Inactive', 'Not Registered'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password
        delete ret.two_factor_secret
        delete ret.password_reset_token
        return ret
      },
    },
    toObject: { virtuals: true },
  }
)

// Indexes
// Note: email index is automatically created by unique: true
UserSchema.index({ status: 1 })
UserSchema.index({ role: 1 })

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Instance method: Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Password comparison failed')
  }
}

// Instance method: Update last login
UserSchema.methods.updateLastLogin = async function () {
  this.last_login = new Date()
  this.login_count += 1
  return this.save()
}

// Instance method: Generate password reset token
UserSchema.methods.generatePasswordResetToken = function () {
  const resetToken = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15)

  this.password_reset_token = resetToken
  this.password_reset_expires = new Date(Date.now() + 3600000) // 1 hour

  return resetToken
}

// Instance method: Clear password reset token
UserSchema.methods.clearPasswordResetToken = function () {
  this.password_reset_token = undefined
  this.password_reset_expires = undefined
}

// Static method: Find by email
UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password')
}

// Static method: Find active users
UserSchema.statics.findActive = function () {
  return this.find({ status: 'Active' })
}

// Static method: Find by role
UserSchema.statics.findByRole = function (role) {
  return this.find({ role, status: 'Active' })
}

// Virtual: Full name with email
UserSchema.virtual('display_name').get(function () {
  return `${this.name} (${this.email})`
})

// Virtual: Is admin
UserSchema.virtual('is_admin').get(function () {
  return this.role === 'Admin'
})

// Virtual: Is active
UserSchema.virtual('is_active').get(function () {
  return this.status === 'Active'
})

const User = mongoose.models.User || mongoose.model('User', UserSchema)

export default User
