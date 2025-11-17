/**
 * Financial Statements Helper Functions
 * Generate Balance Sheet and Profit & Loss statements
 */

import Account from '@/lib/models/Account'
import JournalEntry from '@/lib/models/JournalEntry'

/**
 * Get accounts by type with balances and hierarchy
 * @param {String} accountType - Type of account (Asset, Liability, Equity, Revenue, Expense)
 * @param {Date} asOfDate - Date to calculate balances (optional)
 * @returns {Promise<Array>}
 */
async function getAccountsByTypeWithHierarchy(accountType, asOfDate = null) {
  const accounts = await Account.find({
    account_type: accountType,
    is_active: true,
  }).sort({ account_code: 1 })

  // Build hierarchy structure
  const accountMap = new Map()
  const rootAccounts = []

  // First pass: Create map of all accounts
  for (const account of accounts) {
    const accountObj = {
      _id: account._id,
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      is_header: account.is_header,
      normal_balance: account.normal_balance,
      current_balance: account.current_balance,
      level: account.level,
      parent_id: account.parent_id,
      children: [],
      total_balance: 0, // Will be calculated
    }
    accountMap.set(account._id.toString(), accountObj)
  }

  // Second pass: Build hierarchy and calculate totals
  for (const [id, account] of accountMap) {
    if (account.parent_id) {
      const parent = accountMap.get(account.parent_id.toString())
      if (parent) {
        parent.children.push(account)
      } else {
        rootAccounts.push(account)
      }
    } else {
      rootAccounts.push(account)
    }
  }

  // Calculate totals recursively (bottom-up)
  function calculateAccountTotal(account) {
    if (account.children.length === 0) {
      // Leaf account - use current balance
      account.total_balance = account.current_balance
    } else {
      // Header account - sum children
      let total = 0
      for (const child of account.children) {
        total += calculateAccountTotal(child)
      }
      account.total_balance = total
    }
    return account.total_balance
  }

  // Calculate totals for all root accounts
  for (const account of rootAccounts) {
    calculateAccountTotal(account)
  }

  return rootAccounts
}

/**
 * Flatten hierarchy into a list with indentation
 * @param {Array} accounts - Hierarchical account structure
 * @param {Number} indentLevel - Current indentation level
 * @returns {Array}
 */
function flattenAccountHierarchy(accounts, indentLevel = 0) {
  const flattened = []

  for (const account of accounts) {
    flattened.push({
      ...account,
      indent_level: indentLevel,
      children: undefined, // Remove children from flattened structure
    })

    if (account.children && account.children.length > 0) {
      const childrenFlattened = flattenAccountHierarchy(account.children, indentLevel + 1)
      flattened.push(...childrenFlattened)
    }
  }

  return flattened
}

/**
 * Calculate total for account type
 * @param {Array} accounts - Hierarchical account structure
 * @returns {Number}
 */
function calculateTypeTotal(accounts) {
  let total = 0
  for (const account of accounts) {
    total += account.total_balance || 0
  }
  return Math.round(total * 100) / 100
}

/**
 * Get Balance Sheet as of a specific date
 * @param {Date} asOfDate - Date for the balance sheet
 * @returns {Promise<Object>}
 */
export async function getBalanceSheet(asOfDate = new Date()) {
  // Get accounts by type with hierarchy
  const assetsHierarchy = await getAccountsByTypeWithHierarchy('Asset', asOfDate)
  const liabilitiesHierarchy = await getAccountsByTypeWithHierarchy('Liability', asOfDate)
  const equityHierarchy = await getAccountsByTypeWithHierarchy('Equity', asOfDate)

  // Calculate totals
  const totalAssets = calculateTypeTotal(assetsHierarchy)
  const totalLiabilities = calculateTypeTotal(liabilitiesHierarchy)
  const totalEquity = calculateTypeTotal(equityHierarchy)

  // Flatten for display
  const assets = flattenAccountHierarchy(assetsHierarchy)
  const liabilities = flattenAccountHierarchy(liabilitiesHierarchy)
  const equity = flattenAccountHierarchy(equityHierarchy)

  // Calculate total liabilities and equity
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

  // Check if balanced (Assets = Liabilities + Equity)
  const difference = Math.round((totalAssets - totalLiabilitiesAndEquity) * 100) / 100
  const isBalanced = Math.abs(difference) < 0.01

  return {
    as_of_date: asOfDate,
    assets,
    liabilities,
    equity,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    total_equity: totalEquity,
    total_liabilities_and_equity: totalLiabilitiesAndEquity,
    difference,
    is_balanced: isBalanced,
  }
}

/**
 * Get Profit & Loss Statement for a date range
 * @param {Date} startDate - Start date of the period
 * @param {Date} endDate - End date of the period
 * @returns {Promise<Object>}
 */
export async function getProfitLoss(startDate, endDate = new Date()) {
  // Get accounts by type with hierarchy
  const revenueHierarchy = await getAccountsByTypeWithHierarchy('Revenue', endDate)
  const expensesHierarchy = await getAccountsByTypeWithHierarchy('Expense', endDate)

  // Calculate totals
  const totalRevenue = calculateTypeTotal(revenueHierarchy)
  const totalExpenses = calculateTypeTotal(expensesHierarchy)

  // Flatten for display
  const revenue = flattenAccountHierarchy(revenueHierarchy)
  const expenses = flattenAccountHierarchy(expensesHierarchy)

  // Calculate net profit/loss
  const netProfit = Math.round((totalRevenue - totalExpenses) * 100) / 100
  const isProfitable = netProfit > 0

  return {
    start_date: startDate,
    end_date: endDate,
    revenue,
    expenses,
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    net_profit: netProfit,
    is_profitable: isProfitable,
  }
}

/**
 * Get comparative Balance Sheet (current vs previous period)
 * @param {Date} currentDate - Current period date
 * @param {Date} previousDate - Previous period date
 * @returns {Promise<Object>}
 */
export async function getComparativeBalanceSheet(currentDate, previousDate) {
  const currentBS = await getBalanceSheet(currentDate)
  const previousBS = await getBalanceSheet(previousDate)

  return {
    current_period: currentBS,
    previous_period: previousBS,
    comparison: {
      assets_change: currentBS.total_assets - previousBS.total_assets,
      liabilities_change: currentBS.total_liabilities - previousBS.total_liabilities,
      equity_change: currentBS.total_equity - previousBS.total_equity,
    },
  }
}

/**
 * Get comparative Profit & Loss (current vs previous period)
 * @param {Date} currentStart - Current period start date
 * @param {Date} currentEnd - Current period end date
 * @param {Date} previousStart - Previous period start date
 * @param {Date} previousEnd - Previous period end date
 * @returns {Promise<Object>}
 */
export async function getComparativeProfitLoss(
  currentStart,
  currentEnd,
  previousStart,
  previousEnd
) {
  const currentPL = await getProfitLoss(currentStart, currentEnd)
  const previousPL = await getProfitLoss(previousStart, previousEnd)

  return {
    current_period: currentPL,
    previous_period: previousPL,
    comparison: {
      revenue_change: currentPL.total_revenue - previousPL.total_revenue,
      expenses_change: currentPL.total_expenses - previousPL.total_expenses,
      net_profit_change: currentPL.net_profit - previousPL.net_profit,
    },
  }
}

/**
 * Get key financial ratios
 * @param {Date} asOfDate - Date for calculations
 * @returns {Promise<Object>}
 */
export async function getFinancialRatios(asOfDate = new Date()) {
  const balanceSheet = await getBalanceSheet(asOfDate)

  // Calculate basic ratios
  const currentRatio =
    balanceSheet.total_liabilities > 0
      ? balanceSheet.total_assets / balanceSheet.total_liabilities
      : 0

  const debtToEquityRatio =
    balanceSheet.total_equity > 0 ? balanceSheet.total_liabilities / balanceSheet.total_equity : 0

  const equityRatio =
    balanceSheet.total_assets > 0 ? balanceSheet.total_equity / balanceSheet.total_assets : 0

  return {
    as_of_date: asOfDate,
    current_ratio: Math.round(currentRatio * 100) / 100,
    debt_to_equity_ratio: Math.round(debtToEquityRatio * 100) / 100,
    equity_ratio: Math.round(equityRatio * 100) / 100,
  }
}
