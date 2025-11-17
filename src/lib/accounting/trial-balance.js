/**
 * Trial Balance Helper Functions
 * Generate trial balance reports for the accounting system
 */

import Account from '@/lib/models/Account'

/**
 * Get trial balance as of a specific date
 * @param {Date} asOfDate - Date for the trial balance
 * @returns {Promise<Object>}
 */
export async function getTrialBalance(asOfDate = new Date()) {
  // Get all active accounts that are not headers
  const accounts = await Account.find({ is_active: true, is_header: false }).sort({
    account_code: 1,
  })

  const trialBalance = []
  let totalDebit = 0
  let totalCredit = 0

  for (const account of accounts) {
    const balance = account.current_balance

    // Skip accounts with zero balance
    if (balance === 0) continue

    const entry = {
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      normal_balance: account.normal_balance,
      debit: 0,
      credit: 0,
    }

    // Determine debit or credit based on normal balance and current balance
    if (account.normal_balance === 'Debit') {
      if (balance >= 0) {
        // Normal debit balance
        entry.debit = balance
        totalDebit += balance
      } else {
        // Abnormal credit balance
        entry.credit = Math.abs(balance)
        totalCredit += Math.abs(balance)
      }
    } else {
      // Normal balance is Credit
      if (balance >= 0) {
        // Normal credit balance
        entry.credit = balance
        totalCredit += balance
      } else {
        // Abnormal debit balance
        entry.debit = Math.abs(balance)
        totalDebit += Math.abs(balance)
      }
    }

    trialBalance.push(entry)
  }

  // Round totals to 2 decimal places
  totalDebit = Math.round(totalDebit * 100) / 100
  totalCredit = Math.round(totalCredit * 100) / 100

  return {
    as_of_date: asOfDate,
    trial_balance: trialBalance,
    total_debit: totalDebit,
    total_credit: totalCredit,
    difference: Math.round((totalDebit - totalCredit) * 100) / 100,
    is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
  }
}

/**
 * Get trial balance grouped by account type
 * @param {Date} asOfDate - Date for the trial balance
 * @returns {Promise<Object>}
 */
export async function getGroupedTrialBalance(asOfDate = new Date()) {
  const trialBalanceData = await getTrialBalance(asOfDate)

  // Group by account type
  const grouped = {
    Asset: [],
    Liability: [],
    Equity: [],
    Revenue: [],
    Expense: [],
  }

  for (const entry of trialBalanceData.trial_balance) {
    if (grouped[entry.account_type]) {
      grouped[entry.account_type].push(entry)
    }
  }

  // Calculate subtotals for each type
  const subtotals = {}
  for (const type in grouped) {
    const accounts = grouped[type]
    subtotals[type] = {
      debit: accounts.reduce((sum, acc) => sum + acc.debit, 0),
      credit: accounts.reduce((sum, acc) => sum + acc.credit, 0),
    }
  }

  return {
    as_of_date: asOfDate,
    grouped_accounts: grouped,
    subtotals,
    total_debit: trialBalanceData.total_debit,
    total_credit: trialBalanceData.total_credit,
    difference: trialBalanceData.difference,
    is_balanced: trialBalanceData.is_balanced,
  }
}

/**
 * Validate trial balance
 * Check if books are balanced
 * @param {Date} asOfDate - Date for validation
 * @returns {Promise<Object>}
 */
export async function validateTrialBalance(asOfDate = new Date()) {
  const trialBalanceData = await getTrialBalance(asOfDate)

  const errors = []
  const warnings = []

  // Check if balanced
  if (!trialBalanceData.is_balanced) {
    errors.push(
      `Trial balance is not balanced. Difference: ${trialBalanceData.difference}`
    )
  }

  // Check for accounts with abnormal balances
  for (const entry of trialBalanceData.trial_balance) {
    if (entry.normal_balance === 'Debit' && entry.credit > 0) {
      warnings.push(
        `Account ${entry.account_code} (${entry.account_name}) has abnormal credit balance`
      )
    } else if (entry.normal_balance === 'Credit' && entry.debit > 0) {
      warnings.push(
        `Account ${entry.account_code} (${entry.account_name}) has abnormal debit balance`
      )
    }
  }

  return {
    is_valid: errors.length === 0,
    is_balanced: trialBalanceData.is_balanced,
    errors,
    warnings,
    total_debit: trialBalanceData.total_debit,
    total_credit: trialBalanceData.total_credit,
    difference: trialBalanceData.difference,
  }
}
