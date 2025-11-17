/**
 * Leave Model
 * Manages employee leave applications and approvals
 */

import mongoose from 'mongoose'

const LeaveSchema = new mongoose.Schema({
  // Employee Reference
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  },
  employee_name: {
    type: String,
    required: true,
  },
  employee_code: {
    type: String,
    required: true,
  },

  // Leave Details
  leave_type: {
    type: String,
    enum: ['Casual', 'Sick', 'Annual', 'Maternity', 'Paternity', 'Unpaid', 'Emergency', 'Bereavement'],
    required: true,
    index: true,
  },
  from_date: {
    type: Date,
    required: true,
    index: true,
  },
  to_date: {
    type: Date,
    required: true,
  },
  total_days: {
    type: Number,
    required: true,
    min: 0.5,
  },
  half_day: {
    type: Boolean,
    default: false,
  },

  // Reason
  reason: {
    type: String,
    required: true,
  },

  // Status
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending',
    index: true,
  },

  // Approval Information
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approved_at: {
    type: Date,
  },
  rejection_reason: {
    type: String,
  },

  // Medical Certificate (for sick leave)
  has_medical_certificate: {
    type: Boolean,
    default: false,
  },
  medical_certificate_url: {
    type: String,
  },

  // Additional Information
  contact_number: {
    type: String,
  },
  contact_address: {
    type: String,
  },
  notes: {
    type: String,
  },

  // Metadata
  applied_date: {
    type: Date,
    default: Date.now,
  },
  applied_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
})

// Indexes
LeaveSchema.index({ employee_id: 1, from_date: -1 })
LeaveSchema.index({ status: 1, from_date: -1 })
LeaveSchema.index({ leave_type: 1, status: 1 })

// Pre-save: Calculate total days
LeaveSchema.pre('save', function(next) {
  if (this.isModified('from_date') || this.isModified('to_date')) {
    const diffTime = Math.abs(this.to_date - this.from_date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    if (this.half_day) {
      this.total_days = 0.5
    } else {
      this.total_days = diffDays
    }
  }
  next()
})

// Instance Methods
LeaveSchema.methods.approve = async function(userId) {
  if (this.status !== 'Pending') {
    throw new Error('Only pending leave applications can be approved')
  }

  this.status = 'Approved'
  this.approved_by = userId
  this.approved_at = new Date()
  return this.save()
}

LeaveSchema.methods.reject = async function(userId, reason) {
  if (this.status !== 'Pending') {
    throw new Error('Only pending leave applications can be rejected')
  }

  this.status = 'Rejected'
  this.approved_by = userId
  this.approved_at = new Date()
  this.rejection_reason = reason
  return this.save()
}

LeaveSchema.methods.cancel = async function() {
  if (this.status === 'Cancelled') {
    throw new Error('Leave application is already cancelled')
  }
  if (this.status === 'Approved' && new Date() > this.from_date) {
    throw new Error('Cannot cancel approved leave that has already started')
  }

  this.status = 'Cancelled'
  return this.save()
}

// Static Methods
LeaveSchema.statics.getEmployeeLeaves = async function(employeeId, year) {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  return this.find({
    employee_id: employeeId,
    from_date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ from_date: -1 })
}

LeaveSchema.statics.getLeaveBalance = async function(employeeId, year) {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  const approvedLeaves = await this.find({
    employee_id: employeeId,
    status: 'Approved',
    from_date: {
      $gte: startDate,
      $lte: endDate,
    },
  })

  const leaveByType = approvedLeaves.reduce((acc, leave) => {
    if (!acc[leave.leave_type]) {
      acc[leave.leave_type] = 0
    }
    acc[leave.leave_type] += leave.total_days
    return acc
  }, {})

  // Standard allocations (configurable)
  const allocations = {
    Casual: 12,
    Sick: 14,
    Annual: 21,
    Unpaid: 0,
  }

  return Object.keys(allocations).map(type => ({
    leave_type: type,
    allocated: allocations[type],
    taken: leaveByType[type] || 0,
    remaining: allocations[type] - (leaveByType[type] || 0),
  }))
}

LeaveSchema.statics.getPendingLeaves = async function() {
  return this.find({ status: 'Pending' })
    .populate('employee_id', 'name employee_code department')
    .sort({ applied_date: 1 })
}

export default mongoose.models.Leave || mongoose.model('Leave', LeaveSchema)
