/**
 * Account Model
 * Chart of Accounts (COA) - Core accounting module
 */

import mongoose from 'mongoose'

const AccountSchema = new mongoose.Schema(
  {
    account_code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    account_name: {
      type: String,
      required: true,
      trim: true,
    },
    account_type: {
      type: String,
      enum: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'],
      required: true,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    is_header: {
      type: Boolean,
      default: false,
    },
    normal_balance: {
      type: String,
      enum: ['Debit', 'Credit'],
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
    },
    opening_balance: {
      type: Number,
      default: 0,
    },
    current_balance: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Indexes for better query performance
AccountSchema.index({ account_type: 1, is_active: 1 })
AccountSchema.index({ parent_id: 1 })
AccountSchema.index({ is_header: 1 })

// Virtual for full path
AccountSchema.virtual('full_path').get(function () {
  return `${this.account_code} - ${this.account_name}`
})

// Pre-save middleware to calculate level
AccountSchema.pre('save', async function (next) {
  if (this.parent_id) {
    const parent = await mongoose.model('Account').findById(this.parent_id)
    if (parent) {
      this.level = parent.level + 1
    }
  } else {
    this.level = 0
  }
  next()
})

// Method to get all children
AccountSchema.methods.getChildren = async function () {
  return mongoose.model('Account').find({ parent_id: this._id })
}

// Method to get all descendants (recursive)
AccountSchema.methods.getDescendants = async function () {
  const descendants = []
  const children = await this.getChildren()

  for (const child of children) {
    descendants.push(child)
    const childDescendants = await child.getDescendants()
    descendants.push(...childDescendants)
  }

  return descendants
}

// Static method to build account tree
AccountSchema.statics.buildTree = async function (parentId = null) {
  const accounts = await this.find({ parent_id: parentId, is_active: true }).sort({
    account_code: 1,
  })

  const tree = []
  for (const account of accounts) {
    const node = account.toObject()
    node.children = await this.buildTree(account._id)
    tree.push(node)
  }

  return tree
}

// Static method to get account hierarchy path
AccountSchema.statics.getHierarchyPath = async function (accountId) {
  const path = []
  let current = await this.findById(accountId)

  while (current) {
    path.unshift({
      _id: current._id,
      account_code: current.account_code,
      account_name: current.account_name,
    })

    if (current.parent_id) {
      current = await this.findById(current.parent_id)
    } else {
      current = null
    }
  }

  return path
}

// Prevent deletion if account has children or transactions
AccountSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  const children = await this.getChildren()
  if (children.length > 0) {
    throw new Error('Cannot delete account with child accounts')
  }

  // Check for transactions (will be implemented when Transaction model is created)
  // const transactions = await mongoose.model('Transaction').countDocuments({
  //   $or: [{ debit_account: this._id }, { credit_account: this._id }]
  // })
  // if (transactions > 0) {
  //   throw new Error('Cannot delete account with existing transactions')
  // }

  next()
})

export default mongoose.models.Account || mongoose.model('Account', AccountSchema)
