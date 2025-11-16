/**
 * Journal Entry Model
 * Core double-entry accounting journal
 */

import mongoose from 'mongoose'

const JournalLineSchema = new mongoose.Schema({
  account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  debit: {
    type: Number,
    default: 0,
    min: 0,
  },
  credit: {
    type: Number,
    default: 0,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  // Metadata for advanced reporting
  metadata: {
    is_registered: Boolean,
    stock_type: String,
    customer_id: mongoose.Schema.Types.ObjectId,
    vendor_id: mongoose.Schema.Types.ObjectId,
    employee_id: mongoose.Schema.Types.ObjectId,
    item_id: mongoose.Schema.Types.ObjectId,
  },
})

const JournalEntrySchema = new mongoose.Schema(
  {
    entry_no: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    entry_date: {
      type: Date,
      required: true,
      index: true,
    },
    entry_type: {
      type: String,
      enum: ['Sales', 'Purchase', 'Payment', 'Receipt', 'Adjustment', 'Payroll', 'Manual'],
      required: true,
      index: true,
    },

    // Reference to source transaction
    reference_type: {
      type: String,
      trim: true,
    },
    reference_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reference_no: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // Journal Lines (embedded)
    lines: {
      type: [JournalLineSchema],
      required: true,
      validate: {
        validator: function (lines) {
          return lines && lines.length >= 2
        },
        message: 'Journal entry must have at least 2 lines',
      },
    },

    // Totals
    total_debit: {
      type: Number,
      required: true,
      min: 0,
    },
    total_credit: {
      type: Number,
      required: true,
      min: 0,
    },
    is_balanced: {
      type: Boolean,
      required: true,
      default: false,
    },

    // Status
    posted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Reversal tracking
    is_reversal: {
      type: Boolean,
      default: false,
    },
    reversed_entry_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
    },

    // Audit
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    posted_at: {
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

// Indexes for better query performance
JournalEntrySchema.index({ entry_date: -1, entry_no: -1 })
JournalEntrySchema.index({ reference_type: 1, reference_id: 1 })
JournalEntrySchema.index({ posted: 1, entry_date: -1 })

// Auto-generate entry number before saving
JournalEntrySchema.pre('save', async function (next) {
  if (this.isNew && !this.entry_no) {
    const count = await this.constructor.countDocuments()
    const year = new Date(this.entry_date).getFullYear()
    this.entry_no = `JV-${year}-${(count + 1).toString().padStart(4, '0')}`
  }
  next()
})

// Validation: Must be balanced before saving
JournalEntrySchema.pre('save', function (next) {
  // Calculate totals from lines
  this.total_debit = this.lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  this.total_credit = this.lines.reduce((sum, line) => sum + (line.credit || 0), 0)

  // Round to 2 decimal places to avoid floating point errors
  this.total_debit = Math.round(this.total_debit * 100) / 100
  this.total_credit = Math.round(this.total_credit * 100) / 100

  // Validate balance
  const diff = Math.abs(this.total_debit - this.total_credit)
  if (diff > 0.01) {
    return next(new Error(`Journal entry not balanced. Debits (${this.total_debit}) must equal credits (${this.total_credit}). Difference: ${diff}`))
  }

  this.is_balanced = true
  next()
})

// Validate each line: debit and credit cannot both be non-zero
JournalEntrySchema.pre('save', function (next) {
  for (const line of this.lines) {
    if (line.debit > 0 && line.credit > 0) {
      return next(new Error('A journal line cannot have both debit and credit amounts'))
    }
    if (line.debit === 0 && line.credit === 0) {
      return next(new Error('A journal line must have either a debit or credit amount'))
    }
  }
  next()
})

// Prevent modification of posted entries
JournalEntrySchema.pre('save', function (next) {
  if (!this.isNew && this.posted) {
    return next(new Error('Cannot modify a posted journal entry'))
  }
  next()
})

// Prevent deletion of posted entries
JournalEntrySchema.pre('deleteOne', { document: true, query: false }, function (next) {
  if (this.posted) {
    return next(new Error('Cannot delete a posted journal entry. Please reverse it instead.'))
  }
  next()
})

// Virtual: Check if entry can be edited
JournalEntrySchema.virtual('can_edit').get(function () {
  return !this.posted
})

// Virtual: Check if entry can be posted
JournalEntrySchema.virtual('can_post').get(function () {
  return !this.posted && this.is_balanced
})

// Instance method: Post entry to ledger
JournalEntrySchema.methods.post = async function (userId) {
  if (this.posted) {
    throw new Error('Entry is already posted')
  }

  if (!this.is_balanced) {
    throw new Error('Cannot post an unbalanced entry')
  }

  const Account = mongoose.model('Account')
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Update account balances for each line
    for (const line of this.lines) {
      const account = await Account.findById(line.account_id).session(session)

      if (!account) {
        throw new Error(`Account not found: ${line.account_id}`)
      }

      if (!account.is_active) {
        throw new Error(`Account is inactive: ${account.account_name}`)
      }

      if (account.is_header) {
        throw new Error(`Cannot post to header account: ${account.account_name}`)
      }

      // Update balance based on normal balance
      if (account.normal_balance === 'Debit') {
        account.current_balance += (line.debit || 0) - (line.credit || 0)
      } else {
        account.current_balance += (line.credit || 0) - (line.debit || 0)
      }

      await account.save({ session })
    }

    // Mark as posted
    this.posted = true
    this.posted_by = userId
    this.posted_at = new Date()
    await this.save({ session })

    await session.commitTransaction()
    return this
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

// Instance method: Create reversing entry
JournalEntrySchema.methods.reverse = async function (userId, reversal_date = null) {
  if (!this.posted) {
    throw new Error('Can only reverse posted entries')
  }

  const JournalEntry = mongoose.model('JournalEntry')

  // Create reversing entry with opposite debits/credits
  const reversingLines = this.lines.map((line) => ({
    account_id: line.account_id,
    debit: line.credit, // Swap debit and credit
    credit: line.debit,
    description: line.description,
    metadata: line.metadata,
  }))

  const reversingEntry = new JournalEntry({
    entry_date: reversal_date || new Date(),
    entry_type: this.entry_type,
    reference_type: this.reference_type,
    reference_id: this.reference_id,
    reference_no: this.reference_no,
    description: `REVERSAL: ${this.description}`,
    lines: reversingLines,
    is_reversal: true,
    reversed_entry_id: this._id,
    created_by: userId,
  })

  await reversingEntry.save()

  // Auto-post the reversing entry
  await reversingEntry.post(userId)

  return reversingEntry
}

// Static method: Find unposted entries
JournalEntrySchema.statics.findUnposted = function () {
  return this.find({ posted: false }).sort({ entry_date: -1, entry_no: -1 })
}

// Static method: Find posted entries
JournalEntrySchema.statics.findPosted = function () {
  return this.find({ posted: true }).sort({ entry_date: -1, entry_no: -1 })
}

// Static method: Find entries by date range
JournalEntrySchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    entry_date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ entry_date: -1, entry_no: -1 })
}

const JournalEntry =
  mongoose.models.JournalEntry || mongoose.model('JournalEntry', JournalEntrySchema)

export default JournalEntry
