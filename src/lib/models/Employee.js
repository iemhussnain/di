/**
 * Employee Model
 * Manages employee information for the ERP system
 */

import mongoose from 'mongoose'

const EmployeeSchema = new mongoose.Schema(
  {
    employee_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Personal Info
    cnic: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    date_of_birth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    marital_status: {
      type: String,
      enum: ['Single', 'Married', 'Divorced'],
    },

    // Contact
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

    // Employment
    department_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    designation: {
      type: String,
      required: true,
      trim: true,
    },
    employment_type: {
      type: String,
      enum: ['Permanent', 'Contract', 'Intern'],
      default: 'Permanent',
    },
    joining_date: {
      type: Date,
      required: true,
    },

    // Salary Structure
    basic_salary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        is_taxable: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Bank Details
    bank_account: {
      type: String,
      trim: true,
    },
    bank_name: {
      type: String,
      trim: true,
    },

    // Tax Details
    eobi_number: {
      type: String,
      trim: true,
    },
    social_security_no: {
      type: String,
      trim: true,
    },
    tax_exemption: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Status
    status: {
      type: String,
      enum: ['Active', 'Resigned', 'Terminated'],
      default: 'Active',
    },
    resignation_date: {
      type: Date,
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

// Auto-generate employee code before saving
EmployeeSchema.pre('save', async function (next) {
  if (this.isNew && !this.employee_code) {
    const count = await this.constructor.countDocuments()
    this.employee_code = `EMP-${(count + 1).toString().padStart(5, '0')}`
  }
  next()
})

// Virtual: Total gross salary (basic + all allowances)
EmployeeSchema.virtual('gross_salary').get(function () {
  const totalAllowances = this.allowances.reduce((sum, allowance) => sum + allowance.amount, 0)
  return this.basic_salary + totalAllowances
})

// Virtual: Taxable salary (basic + taxable allowances)
EmployeeSchema.virtual('taxable_salary').get(function () {
  const taxableAllowances = this.allowances
    .filter((allowance) => allowance.is_taxable)
    .reduce((sum, allowance) => sum + allowance.amount, 0)
  return this.basic_salary + taxableAllowances - this.tax_exemption
})

// Virtual: Age calculation
EmployeeSchema.virtual('age').get(function () {
  if (!this.date_of_birth) return null
  const today = new Date()
  const birthDate = new Date(this.date_of_birth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
})

// Virtual: Service duration in years
EmployeeSchema.virtual('service_years').get(function () {
  if (!this.joining_date) return 0
  const endDate = this.resignation_date || new Date()
  const joiningDate = new Date(this.joining_date)
  const years = (endDate - joiningDate) / (1000 * 60 * 60 * 24 * 365.25)
  return Math.floor(years * 10) / 10 // Round to 1 decimal
})

// Instance method: Check if employee is active
EmployeeSchema.methods.isActive = function () {
  return this.status === 'Active'
}

// Instance method: Add allowance
EmployeeSchema.methods.addAllowance = function (name, amount, is_taxable = true) {
  this.allowances.push({ name, amount, is_taxable })
  return this.save()
}

// Instance method: Remove allowance
EmployeeSchema.methods.removeAllowance = function (allowanceId) {
  this.allowances = this.allowances.filter(
    (allowance) => allowance._id.toString() !== allowanceId
  )
  return this.save()
}

// Static method: Find active employees
EmployeeSchema.statics.findActive = function () {
  return this.find({ status: 'Active' })
}

// Static method: Find by department
EmployeeSchema.statics.findByDepartment = function (departmentId) {
  return this.find({ department_id: departmentId })
}

// Static method: Find by employment type
EmployeeSchema.statics.findByEmploymentType = function (employmentType) {
  return this.find({ employment_type: employmentType })
}

const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema)

export default Employee
