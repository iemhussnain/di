/**
 * Seed Chart of Accounts
 * Run: node scripts/seed-accounts.js
 */

require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

// Simple Account Schema (matching the model)
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

const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema)

// Standard Chart of Accounts for Pakistan ERP
const seedAccounts = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing accounts
    console.log('Clearing existing accounts...')
    await Account.deleteMany({})
    console.log('✅ Existing accounts cleared')

    console.log('Creating accounts...\n')

    // ROOT ACCOUNTS (Level 0)
    const assets = await Account.create({
      account_code: '1000',
      account_name: 'Assets',
      account_type: 'Asset',
      normal_balance: 'Debit',
      is_header: true,
      level: 0,
    })
    console.log('✓ Created: 1000 - Assets')

    const liabilities = await Account.create({
      account_code: '2000',
      account_name: 'Liabilities',
      account_type: 'Liability',
      normal_balance: 'Credit',
      is_header: true,
      level: 0,
    })
    console.log('✓ Created: 2000 - Liabilities')

    const equity = await Account.create({
      account_code: '3000',
      account_name: 'Equity',
      account_type: 'Equity',
      normal_balance: 'Credit',
      is_header: true,
      level: 0,
    })
    console.log('✓ Created: 3000 - Equity')

    const revenue = await Account.create({
      account_code: '4000',
      account_name: 'Revenue',
      account_type: 'Revenue',
      normal_balance: 'Credit',
      is_header: true,
      level: 0,
    })
    console.log('✓ Created: 4000 - Revenue')

    const expenses = await Account.create({
      account_code: '5000',
      account_name: 'Expenses',
      account_type: 'Expense',
      normal_balance: 'Debit',
      is_header: true,
      level: 0,
    })
    console.log('✓ Created: 5000 - Expenses\n')

    // ASSET SUB-ACCOUNTS (Level 1)
    const currentAssets = await Account.create({
      account_code: '1100',
      account_name: 'Current Assets',
      account_type: 'Asset',
      parent_id: assets._id,
      normal_balance: 'Debit',
      is_header: true,
      level: 1,
    })
    console.log('✓ Created: 1100 - Current Assets')

    const fixedAssets = await Account.create({
      account_code: '1200',
      account_name: 'Fixed Assets',
      account_type: 'Asset',
      parent_id: assets._id,
      normal_balance: 'Debit',
      is_header: true,
      level: 1,
    })
    console.log('✓ Created: 1200 - Fixed Assets\n')

    // Current Assets Detail (Level 2)
    await Account.create({
      account_code: '1101',
      account_name: 'Cash in Hand',
      account_type: 'Asset',
      parent_id: currentAssets._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
      opening_balance: 50000,
      current_balance: 50000,
    })
    console.log('✓ Created: 1101 - Cash in Hand')

    await Account.create({
      account_code: '1102',
      account_name: 'Cash at Bank',
      account_type: 'Asset',
      parent_id: currentAssets._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
      opening_balance: 500000,
      current_balance: 500000,
    })
    console.log('✓ Created: 1102 - Cash at Bank')

    await Account.create({
      account_code: '1103',
      account_name: 'Accounts Receivable',
      account_type: 'Asset',
      parent_id: currentAssets._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
      opening_balance: 250000,
      current_balance: 250000,
    })
    console.log('✓ Created: 1103 - Accounts Receivable')

    await Account.create({
      account_code: '1104',
      account_name: 'Inventory',
      account_type: 'Asset',
      parent_id: currentAssets._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
      opening_balance: 300000,
      current_balance: 300000,
    })
    console.log('✓ Created: 1104 - Inventory\n')

    // Fixed Assets Detail (Level 2)
    await Account.create({
      account_code: '1201',
      account_name: 'Furniture & Fixtures',
      account_type: 'Asset',
      parent_id: fixedAssets._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
      opening_balance: 150000,
      current_balance: 150000,
    })
    console.log('✓ Created: 1201 - Furniture & Fixtures')

    await Account.create({
      account_code: '1202',
      account_name: 'Machinery & Equipment',
      account_type: 'Asset',
      parent_id: fixedAssets._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
      opening_balance: 500000,
      current_balance: 500000,
    })
    console.log('✓ Created: 1202 - Machinery & Equipment')

    await Account.create({
      account_code: '1203',
      account_name: 'Vehicles',
      account_type: 'Asset',
      parent_id: fixedAssets._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
      opening_balance: 1000000,
      current_balance: 1000000,
    })
    console.log('✓ Created: 1203 - Vehicles\n')

    // LIABILITY SUB-ACCOUNTS (Level 1)
    const currentLiabilities = await Account.create({
      account_code: '2100',
      account_name: 'Current Liabilities',
      account_type: 'Liability',
      parent_id: liabilities._id,
      normal_balance: 'Credit',
      is_header: true,
      level: 1,
    })
    console.log('✓ Created: 2100 - Current Liabilities\n')

    // Current Liabilities Detail (Level 2)
    await Account.create({
      account_code: '2101',
      account_name: 'Accounts Payable',
      account_type: 'Liability',
      parent_id: currentLiabilities._id,
      normal_balance: 'Credit',
      is_header: false,
      level: 2,
      opening_balance: 150000,
      current_balance: 150000,
    })
    console.log('✓ Created: 2101 - Accounts Payable')

    await Account.create({
      account_code: '2102',
      account_name: 'Sales Tax Payable',
      account_type: 'Liability',
      parent_id: currentLiabilities._id,
      normal_balance: 'Credit',
      is_header: false,
      level: 2,
      opening_balance: 50000,
      current_balance: 50000,
    })
    console.log('✓ Created: 2102 - Sales Tax Payable')

    await Account.create({
      account_code: '2103',
      account_name: 'Income Tax Payable',
      account_type: 'Liability',
      parent_id: currentLiabilities._id,
      normal_balance: 'Credit',
      is_header: false,
      level: 2,
      opening_balance: 30000,
      current_balance: 30000,
    })
    console.log('✓ Created: 2103 - Income Tax Payable\n')

    // EQUITY SUB-ACCOUNTS (Level 1)
    await Account.create({
      account_code: '3001',
      account_name: 'Owner Equity',
      account_type: 'Equity',
      parent_id: equity._id,
      normal_balance: 'Credit',
      is_header: false,
      level: 1,
      opening_balance: 2500000,
      current_balance: 2500000,
    })
    console.log('✓ Created: 3001 - Owner Equity')

    await Account.create({
      account_code: '3002',
      account_name: 'Retained Earnings',
      account_type: 'Equity',
      parent_id: equity._id,
      normal_balance: 'Credit',
      is_header: false,
      level: 1,
      opening_balance: 0,
      current_balance: 0,
    })
    console.log('✓ Created: 3002 - Retained Earnings\n')

    // REVENUE SUB-ACCOUNTS (Level 1)
    await Account.create({
      account_code: '4001',
      account_name: 'Sales Revenue',
      account_type: 'Revenue',
      parent_id: revenue._id,
      normal_balance: 'Credit',
      is_header: false,
      level: 1,
    })
    console.log('✓ Created: 4001 - Sales Revenue')

    await Account.create({
      account_code: '4002',
      account_name: 'Service Revenue',
      account_type: 'Revenue',
      parent_id: revenue._id,
      normal_balance: 'Credit',
      is_header: false,
      level: 1,
    })
    console.log('✓ Created: 4002 - Service Revenue\n')

    // EXPENSE SUB-ACCOUNTS (Level 1)
    const operatingExpenses = await Account.create({
      account_code: '5100',
      account_name: 'Operating Expenses',
      account_type: 'Expense',
      parent_id: expenses._id,
      normal_balance: 'Debit',
      is_header: true,
      level: 1,
    })
    console.log('✓ Created: 5100 - Operating Expenses\n')

    // Operating Expenses Detail (Level 2)
    await Account.create({
      account_code: '5101',
      account_name: 'Salaries & Wages',
      account_type: 'Expense',
      parent_id: operatingExpenses._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
    })
    console.log('✓ Created: 5101 - Salaries & Wages')

    await Account.create({
      account_code: '5102',
      account_name: 'Rent Expense',
      account_type: 'Expense',
      parent_id: operatingExpenses._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
    })
    console.log('✓ Created: 5102 - Rent Expense')

    await Account.create({
      account_code: '5103',
      account_name: 'Utilities Expense',
      account_type: 'Expense',
      parent_id: operatingExpenses._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
    })
    console.log('✓ Created: 5103 - Utilities Expense')

    await Account.create({
      account_code: '5104',
      account_name: 'Office Supplies',
      account_type: 'Expense',
      parent_id: operatingExpenses._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
    })
    console.log('✓ Created: 5104 - Office Supplies')

    await Account.create({
      account_code: '5105',
      account_name: 'Depreciation Expense',
      account_type: 'Expense',
      parent_id: operatingExpenses._id,
      normal_balance: 'Debit',
      is_header: false,
      level: 2,
    })
    console.log('✓ Created: 5105 - Depreciation Expense\n')

    const count = await Account.countDocuments()
    console.log(`\n✅ Seed completed successfully! ${count} accounts created.`)

    // Close connection
    await mongoose.connection.close()
    console.log('✅ Database connection closed')
  } catch (error) {
    console.error('❌ Seed error:', error)
    process.exit(1)
  }
}

// Run the seed
seedAccounts()
