/**
 * Payment Helper Functions
 * Business logic for payment operations
 */

import mongoose from 'mongoose'
import Payment from '@/lib/models/Payment'
import SalesInvoice from '@/lib/models/SalesInvoice'
import Customer from '@/lib/models/Customer'
import Vendor from '@/lib/models/Vendor'
import JournalEntry from '@/lib/models/JournalEntry'
import Account from '@/lib/models/Account'

/**
 * Create a new payment
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>}
 */
export async function createPayment(paymentData) {
  // Fetch party details (Customer or Vendor)
  let party
  if (paymentData.party_type === 'Customer') {
    party = await Customer.findById(paymentData.party_id)
  } else {
    party = await Vendor.findById(paymentData.party_id)
  }

  if (!party) {
    throw new Error(`${paymentData.party_type} not found`)
  }

  if (party.status !== 'Active') {
    throw new Error(`${paymentData.party_type} is ${party.status}`)
  }

  // If payment is against an invoice, verify invoice
  if (paymentData.invoice_id) {
    const Invoice = paymentData.invoice_type === 'SalesInvoice' ? SalesInvoice : null
    if (Invoice) {
      const invoice = await Invoice.findById(paymentData.invoice_id)
      if (!invoice) {
        throw new Error('Invoice not found')
      }

      if (!invoice.can_receive_payment) {
        throw new Error('Invoice cannot receive payment')
      }

      if (paymentData.amount > invoice.amount_due) {
        throw new Error('Payment amount exceeds invoice balance')
      }

      paymentData.invoice_no = invoice.invoice_no
    }
  }

  // Verify account exists
  const account = await Account.findById(paymentData.account_id)
  if (!account) {
    throw new Error('Account not found')
  }

  // Create payment
  const payment = new Payment({
    ...paymentData,
    party_name: party.customer_name || party.vendor_name,
    party_code: party.customer_code || party.vendor_code,
  })

  await payment.save()
  return payment
}

/**
 * Post payment and create journal entry
 * @param {String} paymentId - Payment ID
 * @param {String} userId - User ID
 * @returns {Promise<Object>}
 */
export async function postPayment(paymentId, userId) {
  const payment = await Payment.findById(paymentId)
    .populate('account_id')
    .populate('party_id')

  if (!payment) {
    throw new Error('Payment not found')
  }

  if (!payment.can_be_posted) {
    throw new Error('Payment cannot be posted')
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Create journal entry based on payment type
    const journalLines = []

    if (payment.payment_type === 'Receipt') {
      // Customer payment received
      // Debit: Cash/Bank Account (Asset increases)
      journalLines.push({
        account_id: payment.account_id._id,
        description: `Receipt from ${payment.party_name} - ${payment.payment_no}`,
        debit: payment.amount,
        credit: 0,
      })

      // Credit: Accounts Receivable (Asset decreases)
      const accountsReceivableAccount = await Account.findOne({
        account_code: '1200',
      }).session(session)

      if (!accountsReceivableAccount) {
        throw new Error('Accounts Receivable account not found')
      }

      journalLines.push({
        account_id: accountsReceivableAccount._id,
        description: `Receipt from ${payment.party_name} - ${payment.payment_no}`,
        debit: 0,
        credit: payment.amount,
      })

      // Update customer balance (decrease receivable)
      const customer = await Customer.findById(payment.party_id).session(session)
      customer.current_balance += payment.amount // Negative balance increases (becomes less negative)
      await customer.save({ session })

      // Update invoice if payment is against an invoice
      if (payment.invoice_id && payment.invoice_type === 'SalesInvoice') {
        const invoice = await SalesInvoice.findById(payment.invoice_id).session(session)
        await invoice.recordPayment(payment.amount)
      }
    } else {
      // Payment to vendor
      // Credit: Cash/Bank Account (Asset decreases)
      journalLines.push({
        account_id: payment.account_id._id,
        description: `Payment to ${payment.party_name} - ${payment.payment_no}`,
        debit: 0,
        credit: payment.amount,
      })

      // Debit: Accounts Payable (Liability decreases)
      const accountsPayableAccount = await Account.findOne({
        account_code: '2100',
      }).session(session)

      if (!accountsPayableAccount) {
        throw new Error('Accounts Payable account not found')
      }

      journalLines.push({
        account_id: accountsPayableAccount._id,
        description: `Payment to ${payment.party_name} - ${payment.payment_no}`,
        debit: payment.amount,
        credit: 0,
      })

      // Update vendor balance (decrease payable)
      const vendor = await Vendor.findById(payment.party_id).session(session)
      vendor.current_balance -= payment.amount
      await vendor.save({ session })
    }

    // Create journal entry
    const journalEntry = new JournalEntry({
      entry_date: payment.payment_date,
      entry_type: payment.payment_type === 'Receipt' ? 'Receipt' : 'Payment',
      reference_no: payment.payment_no,
      description: `${payment.payment_type} - ${payment.party_name} (${payment.payment_method})`,
      lines: journalLines,
      created_by: userId,
    })

    await journalEntry.save({ session })

    // Post journal entry
    await journalEntry.post(userId, session)

    // Update payment
    payment.journal_entry_id = journalEntry._id
    await payment.postPayment(userId)

    await session.commitTransaction()

    return { payment, journalEntry }
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Get payment summary
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {String} paymentType - Payment type (Receipt or Payment)
 * @returns {Promise<Object>}
 */
export async function getPaymentSummary(startDate, endDate, paymentType = null) {
  return Payment.getPaymentSummary(startDate, endDate, paymentType)
}

/**
 * Get cashflow summary
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>}
 */
export async function getCashflowSummary(startDate, endDate) {
  const summary = await Payment.getPaymentSummary(startDate, endDate)

  // Get opening balance (sum of all cash/bank accounts)
  const cashAccounts = await Account.find({
    account_type: 'Asset',
    account_code: { $regex: /^1[01]/ }, // Cash and Bank accounts
    is_active: true,
  })

  const openingBalance = cashAccounts.reduce((sum, acc) => sum + acc.current_balance, 0)

  return {
    period: { startDate, endDate },
    opening_balance: openingBalance,
    receipts: summary.receipts,
    payments: summary.payments,
    net_cashflow: summary.net_cashflow,
    closing_balance: openingBalance + summary.net_cashflow,
  }
}

/**
 * Get payment history for a party
 * @param {String} partyId - Party ID
 * @param {String} partyType - Party type (Customer or Vendor)
 * @returns {Promise<Array>}
 */
export async function getPaymentHistory(partyId, partyType) {
  return Payment.findByParty(partyId, partyType)
}
