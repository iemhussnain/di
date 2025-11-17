/**
 * Sales Invoice Helper Functions
 * Business logic for sales invoice operations
 */

import mongoose from 'mongoose'
import SalesInvoice from '@/lib/models/SalesInvoice'
import Customer from '@/lib/models/Customer'
import Item from '@/lib/models/Item'
import JournalEntry from '@/lib/models/JournalEntry'
import Account from '@/lib/models/Account'

/**
 * Create a new sales invoice
 * @param {Object} invoiceData - Sales invoice data
 * @returns {Promise<Object>}
 */
export async function createSalesInvoice(invoiceData) {
  // Fetch customer details
  const customer = await Customer.findById(invoiceData.customer_id)
  if (!customer) {
    throw new Error('Customer not found')
  }

  if (customer.status !== 'Active') {
    throw new Error(`Customer is ${customer.status}`)
  }

  // Populate line items with product details
  const lines = []
  for (const line of invoiceData.lines) {
    const item = await Item.findById(line.item_id)
    if (!item) {
      throw new Error(`Item with ID ${line.item_id} not found`)
    }

    if (!item.is_active) {
      throw new Error(`Item ${item.item_name} is not active`)
    }

    lines.push({
      item_id: item._id,
      description: line.description || item.description,
      quantity: line.quantity,
      unit_price: line.unit_price || item.selling_price,
      discount_percentage: line.discount_percentage || 0,
      discount_amount: line.discount_amount || 0,
      tax_percentage: line.tax_percentage || item.tax_rate,
      tax_amount: line.tax_amount || 0,
      line_total: 0, // Will be calculated by model
    })
  }

  // Create sales invoice
  const invoice = new SalesInvoice({
    ...invoiceData,
    customer_name: customer.customer_name,
    customer_code: customer.customer_code,
    customer_ntn: customer.ntn,
    customer_strn: customer.strn,
    lines,
  })

  await invoice.save()
  return invoice
}

/**
 * Post sales invoice and create journal entry
 * @param {String} invoiceId - Sales invoice ID
 * @param {String} userId - User ID
 * @returns {Promise<Object>}
 */
export async function postSalesInvoice(invoiceId, userId) {
  const invoice = await SalesInvoice.findById(invoiceId).populate('customer_id')

  if (!invoice) {
    throw new Error('Sales invoice not found')
  }

  if (!invoice.can_be_posted) {
    throw new Error('Invoice cannot be posted')
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Find required accounts
    const accountsReceivableAccount = await Account.findOne({
      account_code: '1200', // Accounts Receivable
    }).session(session)

    const salesRevenueAccount = await Account.findOne({
      account_code: '4000', // Sales Revenue
    }).session(session)

    const salesTaxPayableAccount = await Account.findOne({
      account_code: '2300', // Sales Tax Payable
    }).session(session)

    if (!accountsReceivableAccount || !salesRevenueAccount || !salesTaxPayableAccount) {
      throw new Error('Required accounts not found in chart of accounts')
    }

    // Create journal entry
    const journalLines = []

    // Debit: Accounts Receivable (Asset increases)
    journalLines.push({
      account_id: accountsReceivableAccount._id,
      description: `Sales to ${invoice.customer_name} - Invoice ${invoice.invoice_no}`,
      debit: invoice.grand_total,
      credit: 0,
    })

    // Credit: Sales Revenue
    const revenueAmount = invoice.subtotal - invoice.total_discount
    journalLines.push({
      account_id: salesRevenueAccount._id,
      description: `Sales to ${invoice.customer_name} - Invoice ${invoice.invoice_no}`,
      debit: 0,
      credit: revenueAmount,
    })

    // Credit: Sales Tax Payable (if applicable)
    if (invoice.total_tax > 0) {
      journalLines.push({
        account_id: salesTaxPayableAccount._id,
        description: `Sales tax on Invoice ${invoice.invoice_no}`,
        debit: 0,
        credit: invoice.total_tax,
      })
    }

    // Create journal entry
    const journalEntry = new JournalEntry({
      entry_date: invoice.invoice_date,
      entry_type: 'Sales',
      reference_no: invoice.invoice_no,
      description: `Sales Invoice ${invoice.invoice_no} - ${invoice.customer_name}`,
      lines: journalLines,
      created_by: userId,
    })

    await journalEntry.save({ session })

    // Post journal entry
    await journalEntry.post(userId, session)

    // Update invoice
    invoice.journal_entry_id = journalEntry._id
    await invoice.postInvoice(userId)

    // Update customer balance (increase receivable)
    const customer = invoice.customer_id
    customer.current_balance -= invoice.grand_total // Negative = customer owes us
    await customer.save({ session })

    await session.commitTransaction()

    return { invoice, journalEntry }
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
}

/**
 * Get revenue summary
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>}
 */
export async function getRevenueSummary(startDate, endDate) {
  return SalesInvoice.getRevenueSummary(startDate, endDate)
}

/**
 * Get aging report (invoices by age)
 * @returns {Promise<Object>}
 */
export async function getAgingReport() {
  const today = new Date()
  const invoices = await SalesInvoice.find({
    posted: true,
    status: { $nin: ['Fully Paid', 'Cancelled'] },
    amount_due: { $gt: 0 },
  })
    .populate('customer_id', 'customer_code customer_name')
    .sort({ due_date: 1 })

  const aging = {
    current: { count: 0, amount: 0, invoices: [] },
    '1-30': { count: 0, amount: 0, invoices: [] },
    '31-60': { count: 0, amount: 0, invoices: [] },
    '61-90': { count: 0, amount: 0, invoices: [] },
    'over-90': { count: 0, amount: 0, invoices: [] },
  }

  invoices.forEach((invoice) => {
    const daysOverdue = Math.floor((today - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24))

    let bucket
    if (daysOverdue <= 0) {
      bucket = 'current'
    } else if (daysOverdue <= 30) {
      bucket = '1-30'
    } else if (daysOverdue <= 60) {
      bucket = '31-60'
    } else if (daysOverdue <= 90) {
      bucket = '61-90'
    } else {
      bucket = 'over-90'
    }

    aging[bucket].count++
    aging[bucket].amount += invoice.amount_due
    aging[bucket].invoices.push({
      invoice_no: invoice.invoice_no,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      customer_code: invoice.customer_id?.customer_code || invoice.customer_code,
      customer_name: invoice.customer_id?.customer_name || invoice.customer_name,
      amount_due: invoice.amount_due,
      days_overdue: daysOverdue,
    })
  })

  // Calculate totals
  const totals = {
    count: 0,
    amount: 0,
  }

  Object.values(aging).forEach((bucket) => {
    totals.count += bucket.count
    totals.amount += bucket.amount
    bucket.amount = Math.round(bucket.amount * 100) / 100
  })

  totals.amount = Math.round(totals.amount * 100) / 100

  return { aging, totals }
}

/**
 * Get customer statement
 * @param {String} customerId - Customer ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>}
 */
export async function getCustomerStatement(customerId, startDate, endDate) {
  const customer = await Customer.findById(customerId)
  if (!customer) {
    throw new Error('Customer not found')
  }

  const invoices = await SalesInvoice.find({
    customer_id: customerId,
    invoice_date: { $gte: startDate, $lte: endDate },
    posted: true,
    status: { $ne: 'Cancelled' },
  }).sort({ invoice_date: 1 })

  const transactions = invoices.map((inv) => ({
    date: inv.invoice_date,
    type: 'Invoice',
    reference: inv.invoice_no,
    debit: inv.grand_total,
    credit: 0,
    balance: 0, // Will be calculated
  }))

  // Calculate running balance
  let balance = 0
  transactions.forEach((txn) => {
    balance += txn.debit - txn.credit
    txn.balance = balance
  })

  return {
    customer: {
      customer_code: customer.customer_code,
      customer_name: customer.customer_name,
      current_balance: customer.current_balance,
    },
    period: { startDate, endDate },
    transactions,
    summary: {
      total_invoiced: transactions.reduce((sum, t) => sum + t.debit, 0),
      total_paid: transactions.reduce((sum, t) => sum + t.credit, 0),
      balance: balance,
    },
  }
}
