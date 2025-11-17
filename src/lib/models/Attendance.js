/**
 * Attendance Model
 * Tracks employee attendance, check-in/check-out times
 */

import mongoose from 'mongoose'

const AttendanceSchema = new mongoose.Schema({
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

  // Date
  date: {
    type: Date,
    required: true,
    index: true,
  },

  // Time Tracking
  check_in: {
    type: Date,
  },
  check_out: {
    type: Date,
  },
  work_hours: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Status
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Late', 'On Leave', 'Holiday', 'Weekend'],
    default: 'Absent',
    index: true,
  },

  // Late/Early Information
  is_late: {
    type: Boolean,
    default: false,
  },
  late_by_minutes: {
    type: Number,
    default: 0,
    min: 0,
  },
  is_early_checkout: {
    type: Boolean,
    default: false,
  },
  early_by_minutes: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Break Time
  break_duration_minutes: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Overtime
  overtime_hours: {
    type: Number,
    default: 0,
    min: 0,
  },
  is_overtime_approved: {
    type: Boolean,
    default: false,
  },

  // Additional Information
  notes: {
    type: String,
  },
  location: {
    type: String,
  },

  // Leave Reference (if on leave)
  leave_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave',
  },

  // Metadata
  marked_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
})

// Compound Index: Employee + Date (unique)
AttendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true })
AttendanceSchema.index({ status: 1, date: -1 })
AttendanceSchema.index({ date: -1 })

// Pre-save: Calculate work hours
AttendanceSchema.pre('save', function(next) {
  if (this.check_in && this.check_out) {
    const diffMs = this.check_out - this.check_in
    const diffHours = diffMs / (1000 * 60 * 60)
    this.work_hours = Math.max(0, diffHours - (this.break_duration_minutes / 60))

    // Calculate overtime (assuming 8-hour standard)
    if (this.work_hours > 8) {
      this.overtime_hours = this.work_hours - 8
    }
  }
  next()
})

// Instance Methods
AttendanceSchema.methods.markPresent = async function(checkIn, checkOut) {
  this.status = 'Present'
  this.check_in = checkIn
  this.check_out = checkOut
  return this.save()
}

AttendanceSchema.methods.markAbsent = async function() {
  this.status = 'Absent'
  this.check_in = null
  this.check_out = null
  this.work_hours = 0
  return this.save()
}

AttendanceSchema.methods.markLeave = async function(leaveId) {
  this.status = 'On Leave'
  this.leave_id = leaveId
  this.check_in = null
  this.check_out = null
  this.work_hours = 0
  return this.save()
}

// Static Methods
AttendanceSchema.statics.getMonthlyAttendance = async function(employeeId, year, month) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  return this.find({
    employee_id: employeeId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 })
}

AttendanceSchema.statics.getAttendanceSummary = async function(employeeId, startDate, endDate) {
  const attendance = await this.find({
    employee_id: employeeId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  })

  return {
    total_days: attendance.length,
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    half_day: attendance.filter(a => a.status === 'Half Day').length,
    on_leave: attendance.filter(a => a.status === 'On Leave').length,
    late: attendance.filter(a => a.is_late).length,
    total_work_hours: attendance.reduce((sum, a) => sum + a.work_hours, 0),
    total_overtime: attendance.reduce((sum, a) => sum + a.overtime_hours, 0),
  }
}

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema)
