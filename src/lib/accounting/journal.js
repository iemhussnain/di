/**
 * Journal Entry Helper Functions
 * Core accounting functions for creating and managing journal entries
 */

import JournalEntry from '@/lib/models/JournalEntry'
import Account from '@/lib/models/Account'
import mongoose from 'mongoose'

/**
 * Create a new journal entry
 * @param {Object} data - Journal entry data
 * @returns {Promise<JournalEntry>}
 */
export async function createJournalEntry(data) {
  const { entry_type, reference_type, reference_id, reference_no, lines, description, entry_date, created_by, notes } = data

  // Calculate totals
  const total_debit = lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  const total_credit = lines.reduce((sum, line) => sum + (line.credit || 0), 0)

  // Round to 2 decimal places
  const roundedDebit = Math.round(total_debit * 100) / 100
  const roundedCredit = Math.round(total_credit * 100) / 100

  // Validate balance
  const diff = Math.abs(roundedDebit - roundedCredit)
  if (diff > 0.01) {
    throw new Error(
      `Journal entry not balanced. Debits: ${roundedDebit}, Credits: ${roundedCredit}, Difference: ${diff}`
    )
  }

  // Validate that all accounts exist and are active
  for (const line of lines) {
    const account = await Account.findById(line.account_id)
    if (!account) {
      throw new Error(`Account not found: ${line.account_id}`)
    }
    if (!account.is_active) {
      throw new Error(`Account is inactive: ${account.account_name}`)
    }
    if (account.is_header) {
      throw new Error(`Cannot use header account: ${account.account_name}`)
    }
  }

  // Create entry
  const entry = await JournalEntry.create({
    entry_date: entry_date || new Date(),
    entry_type,
    reference_type,
    reference_id,
    reference_no,
    description,
    lines,
    total_debit: roundedDebit,
    total_credit: roundedCredit,
    is_balanced: true,
    created_by,
    notes,
  })

  return entry
}

/**
 * Post a journal entry to the ledger
 * Updates all related account balances
 * @param {string} entryId - Journal entry ID
 * @param {string} userId - User ID who is posting
 * @returns {Promise<JournalEntry>}
 */
export async function postJournalEntry(entryId, userId) {
  const entry = await JournalEntry.findById(entryId).populate('lines.account_id')

  if (!entry) {
    throw new Error('Journal entry not found')
  }

  if (entry.posted) {
    throw new Error('Journal entry is already posted')
  }

  if (!entry.is_balanced) {
    throw new Error('Cannot post an unbalanced journal entry')
  }

  // Use the instance method which handles transactions
  await entry.post(userId)

  return entry
}

/**
 * Reverse a posted journal entry
 * Creates a new entry with opposite debits/credits
 * @param {string} entryId - Journal entry ID to reverse
 * @param {string} userId - User ID creating the reversal
 * @param {Date} reversalDate - Date for the reversing entry (defaults to today)
 * @returns {Promise<JournalEntry>}
 */
export async function reverseJournalEntry(entryId, userId, reversalDate = null) {
  const entry = await JournalEntry.findById(entryId)

  if (!entry) {
    throw new Error('Journal entry not found')
  }

  if (!entry.posted) {
    throw new Error('Can only reverse posted journal entries')
  }

  // Use the instance method to create reversing entry
  const reversingEntry = await entry.reverse(userId, reversalDate)

  return reversingEntry
}

/**
 * Get journal entries by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Additional filter options
 * @returns {Promise<Array>}
 */
export async function getJournalEntriesByDateRange(startDate, endDate, options = {}) {
  const filter = {
    entry_date: {
      $gte: startDate,
      $lte: endDate,
    },
  }

  if (options.posted !== undefined) {
    filter.posted = options.posted
  }

  if (options.entry_type) {
    filter.entry_type = options.entry_type
  }

  const entries = await JournalEntry.find(filter)
    .populate('lines.account_id', 'account_code account_name')
    .populate('created_by', 'name email')
    .populate('posted_by', 'name email')
    .sort({ entry_date: -1, entry_no: -1 })

  return entries
}

/**
 * Get account ledger
 * Returns all journal lines for a specific account
 * @param {string} accountId - Account ID
 * @param {Date} startDate - Start date (optional)
 * @param {Date} endDate - End date (optional)
 * @returns {Promise<Array>}
 */
export async function getAccountLedger(accountId, startDate = null, endDate = null) {
  const filter = {
    'lines.account_id': accountId,
    posted: true, // Only posted entries affect the ledger
  }

  if (startDate && endDate) {
    filter.entry_date = {
      $gte: startDate,
      $lte: endDate,
    }
  }

  const entries = await JournalEntry.find(filter)
    .populate('lines.account_id')
    .sort({ entry_date: 1, entry_no: 1 })

  // Extract relevant lines and calculate running balance
  const account = await Account.findById(accountId)
  if (!account) {
    throw new Error('Account not found')
  }

  let runningBalance = account.opening_balance || 0
  const ledgerLines = []

  for (const entry of entries) {
    for (const line of entry.lines) {
      if (line.account_id._id.toString() === accountId) {
        // Calculate balance change
        const balanceChange =
          account.normal_balance === 'Debit'
            ? line.debit - line.credit
            : line.credit - line.debit

        runningBalance += balanceChange

        ledgerLines.push({
          date: entry.entry_date,
          entry_no: entry.entry_no,
          description: line.description || entry.description,
          debit: line.debit,
          credit: line.credit,
          balance: runningBalance,
          entry_id: entry._id,
        })
      }
    }
  }

  return {
    account,
    opening_balance: account.opening_balance || 0,
    ledger_lines: ledgerLines,
    closing_balance: runningBalance,
  }
}

/**
 * Get trial balance
 * Returns all accounts with their debit and credit balances
 * @param {Date} asOfDate - Date for the trial balance (defaults to today)
 * @returns {Promise<Object>}
 */
export async function getTrialBalance(asOfDate = new Date()) {
  const accounts = await Account.find({ is_active: true, is_header: false }).sort({
    account_code: 1,
  })

  const trialBalance = []
  let totalDebits = 0
  let totalCredits = 0

  for (const account of accounts) {
    const balance = account.current_balance

    const debitBalance = balance >= 0 && account.normal_balance === 'Debit' ? balance : 0
    const creditBalance = balance >= 0 && account.normal_balance === 'Credit' ? balance : 0

    // Handle negative balances (reverse of normal)
    const debitBalanceReverse = balance < 0 && account.normal_balance === 'Credit' ? Math.abs(balance) : 0
    const creditBalanceReverse = balance < 0 && account.normal_balance === 'Debit' ? Math.abs(balance) : 0

    const finalDebit = debitBalance + debitBalanceReverse
    const finalCredit = creditBalance + creditBalanceReverse

    totalDebits += finalDebit
    totalCredits += finalCredit

    trialBalance.push({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      debit: finalDebit,
      credit: finalCredit,
    })
  }

  return {
    as_of_date: asOfDate,
    accounts: trialBalance,
    total_debits: Math.round(totalDebits * 100) / 100,
    total_credits: Math.round(totalCredits * 100) / 100,
    is_balanced: Math.abs(totalDebits - totalCredits) < 0.01,
  }
}

/**
 * Validate journal entry before posting
 * @param {string} entryId - Journal entry ID
 * @returns {Promise<Object>}
 */
export async function validateJournalEntry(entryId) {
  const entry = await JournalEntry.findById(entryId).populate('lines.account_id')

  const errors = []
  const warnings = []

  if (!entry) {
    errors.push('Journal entry not found')
    return { valid: false, errors, warnings }
  }

  if (entry.posted) {
    errors.push('Journal entry is already posted')
  }

  // Check balance
  const diff = Math.abs(entry.total_debit - entry.total_credit)
  if (diff > 0.01) {
    errors.push(`Entry not balanced. Difference: ${diff}`)
  }

  // Check minimum lines
  if (entry.lines.length < 2) {
    errors.push('Journal entry must have at least 2 lines')
  }

  // Validate each line
  for (let i = 0; i < entry.lines.length; i++) {
    const line = entry.lines[i]

    if (!line.account_id) {
      errors.push(`Line ${i + 1}: Account is required`)
      continue
    }

    const account = line.account_id

    if (!account.is_active) {
      errors.push(`Line ${i + 1}: Account "${account.account_name}" is inactive`)
    }

    if (account.is_header) {
      errors.push(`Line ${i + 1}: Cannot use header account "${account.account_name}"`)
    }

    if (line.debit === 0 && line.credit === 0) {
      errors.push(`Line ${i + 1}: Must have either debit or credit amount`)
    }

    if (line.debit > 0 && line.credit > 0) {
      errors.push(`Line ${i + 1}: Cannot have both debit and credit amounts`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get ledger summary for all accounts
 * @param {Date} startDate - Start date (optional)
 * @param {Date} endDate - End date (optional)
 * @param {Object} options - Additional options
 * @returns {Promise<Array>}
 */
export async function getLedgerSummary(startDate = null, endDate = null, options = {}) {
  // Get all active accounts that are not headers
  const accounts = await Account.find({ is_active: true, is_header: false }).sort({
    account_code: 1,
  })

  const summary = []

  for (const account of accounts) {
    // Get ledger for this account
    const ledger = await getAccountLedger(account._id.toString(), startDate, endDate)

    // Calculate total debits and credits
    const totalDebits = ledger.ledger_lines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredits = ledger.ledger_lines.reduce((sum, line) => sum + line.credit, 0)
    const netMovement = totalDebits - totalCredits

    // Only include accounts with activity or non-zero balances
    if (options.showZeroBalances || ledger.closing_balance !== 0 || netMovement !== 0) {
      summary.push({
        account_id: account._id,
        account_code: account.account_code,
        account_name: account.account_name,
        account_type: account.account_type,
        normal_balance: account.normal_balance,
        opening_balance: ledger.opening_balance,
        total_debits: totalDebits,
        total_credits: totalCredits,
        net_movement: netMovement,
        closing_balance: ledger.closing_balance,
        transaction_count: ledger.ledger_lines.length,
      })
    }
  }

  return summary
}
