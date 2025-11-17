/**
 * Payroll Model
 * Manages employee salary processing and payslips
 */

import mongoose from 'mongoose'

const PayrollEarningSchema = new mongoose.Schema({
  component: {
    type: String,
    required: true,
    enum: ['Basic Salary', 'HRA', 'Conveyance', 'Medical Allowance', 'Special Allowance', 'Bonus', 'Overtime', 'Other'],
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false })

const PayrollDeductionSchema = new mongoose.Schema({
  component: {
    type: String,
    required: true,
    enum: ['Income Tax', 'Provident Fund', 'Professional Tax', 'ESI', 'Loan Repayment', 'Late Deduction', 'Absence Deduction', 'Other'],
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false })

const PayrollSchema = new mongoose.Schema({
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

  // Payroll Period
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    index: true,
  },
  year: {
    type: Number,
    required: true,
    index: true,
  },
  payment_date: {
    type: Date,
    required: true,
  },

  // Salary Components
  basic_salary: {
    type: Number,
    required: true,
    min: 0,
  },
  earnings: {
    type: [PayrollEarningSchema],
    default: [],
  },
  gross_salary: {
    type: Number,
    required: true,
    min: 0,
  },

  // Deductions
  deductions: {
    type: [PayrollDeductionSchema],
    default: [],
  },
  total_deductions: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Net Salary
  net_salary: {
    type: Number,
    required: true,
    min: 0,
  },

  // Attendance Details
  working_days: {
    type: Number,
    required: true,
    min: 0,
  },
  present_days: {
    type: Number,
    required: true,
    min: 0,
  },
  absent_days: {
    type: Number,
    default: 0,
    min: 0,
  },
  leaves_taken: {
    type: Number,
    default: 0,
    min: 0,
  },
  late_days: {
    type: Number,
    default: 0,
    min: 0,
  },
  overtime_hours: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Payment Information
  payment_mode: {
    type: String,
    enum: ['Bank Transfer', 'Cash', 'Cheque'],
    default: 'Bank Transfer',
  },
  bank_account: {
    type: String,
  },
  transaction_reference: {
    type: String,
  },

  // Status
  status: {
    type: String,
    enum: ['Draft', 'Processed', 'Paid', 'On Hold'],
    default: 'Draft',
    index: true,
  },
  processed_at: {
    type: Date,
  },
  paid_at: {
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
  processed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
})

// Compound Index: Employee + Month + Year (unique)
PayrollSchema.index({ employee_id: 1, month: 1, year: 1 }, { unique: true })
PayrollSchema.index({ status: 1, payment_date: -1 })
PayrollSchema.index({ year: -1, month: -1 })

// Pre-save: Calculate totals
PayrollSchema.pre('save', function(next) {
  // Calculate gross salary
  if (this.isModified('basic_salary') || this.isModified('earnings')) {
    const totalEarnings = this.earnings.reduce((sum, earning) => sum + earning.amount, 0)
    this.gross_salary = this.basic_salary + totalEarnings
  }

  // Calculate total deductions
  if (this.isModified('deductions')) {
    this.total_deductions = this.deductions.reduce((sum, deduction) => sum + deduction.amount, 0)
  }

  // Calculate net salary
  if (this.isModified('gross_salary') || this.isModified('total_deductions')) {
    this.net_salary = this.gross_salary - this.total_deductions
  }

  // Calculate absent days
  if (this.isModified('working_days') || this.isModified('present_days')) {
    this.absent_days = this.working_days - this.present_days
  }

  next()
})

// Instance Methods
PayrollSchema.methods.processPayroll = async function(userId) {
  if (this.status !== 'Draft') {
    throw new Error('Only draft payroll can be processed')
  }

  this.status = 'Processed'
  this.processed_at = new Date()
  this.processed_by = userId
  return this.save()
}

PayrollSchema.methods.markPaid = async function(paymentMode, transactionRef) {
  if (this.status !== 'Processed') {
    throw new Error('Payroll must be processed before marking as paid')
  }

  this.status = 'Paid'
  this.paid_at = new Date()
  this.payment_mode = paymentMode
  this.transaction_reference = transactionRef
  return this.save()
}

PayrollSchema.methods.holdPayroll = async function(reason) {
  if (this.status === 'Paid') {
    throw new Error('Cannot hold already paid payroll')
  }

  this.status = 'On Hold'
  this.notes = reason
  return this.save()
}

// Static Methods
PayrollSchema.statics.generatePayroll = async function(employeeId, month, year, attendanceData, userId) {
  const Employee = mongoose.model('Employee')
  const employee = await Employee.findById(employeeId)

  if (!employee) {
    throw new Error('Employee not found')
  }

  // Calculate per-day salary
  const workingDays = attendanceData.working_days
  const perDaySalary = employee.salary / workingDays

  // Calculate overtime
  const overtimePay = (attendanceData.overtime_hours || 0) * (employee.salary / (workingDays * 8))

  // Calculate absence deduction
  const absenceDeduction = (attendanceData.absent_days || 0) * perDaySalary

  // Calculate late deduction (assuming 1% per late)
  const lateDeduction = (attendanceData.late_days || 0) * (employee.salary * 0.01)

  // Build earnings
  const earnings = []
  if (overtimePay > 0) {
    earnings.push({ component: 'Overtime', amount: overtimePay })
  }

  // Build deductions
  const deductions = []
  if (absenceDeduction > 0) {
    deductions.push({ component: 'Absence Deduction', amount: absenceDeduction })
  }
  if (lateDeduction > 0) {
    deductions.push({ component: 'Late Deduction', amount: lateDeduction })
  }

  // Income tax (simplified - 10% if salary > 50000)
  if (employee.salary > 50000) {
    deductions.push({ component: 'Income Tax', amount: employee.salary * 0.10 })
  }

  // Create payroll
  return this.create({
    employee_id: employeeId,
    employee_name: employee.name,
    employee_code: employee.employee_code,
    month,
    year,
    payment_date: new Date(year, month, 1), // First day of next month
    basic_salary: employee.salary,
    earnings,
    deductions,
    working_days: workingDays,
    present_days: attendanceData.present_days,
    absent_days: attendanceData.absent_days,
    leaves_taken: attendanceData.leaves_taken || 0,
    late_days: attendanceData.late_days || 0,
    overtime_hours: attendanceData.overtime_hours || 0,
    bank_account: employee.bank_account,
    created_by: userId,
  })
}

PayrollSchema.statics.getMonthlyPayroll = async function(month, year) {
  return this.find({ month, year })
    .populate('employee_id', 'name employee_code department')
    .sort({ employee_code: 1 })
}

PayrollSchema.statics.getEmployeePayrollHistory = async function(employeeId, limit = 12) {
  return this.find({ employee_id: employeeId })
    .sort({ year: -1, month: -1 })
    .limit(limit)
}

export default mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema)
