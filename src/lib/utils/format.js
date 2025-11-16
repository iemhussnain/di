/**
 * Formatting Utilities for ERP System
 */

import dayjs from 'dayjs'
import Decimal from 'decimal.js'

/**
 * Format number as currency (PKR)
 * @param {number|string} amount
 * @param {boolean} showSymbol - Show Rs. symbol
 * @returns {string}
 */
export function formatCurrency(amount, showSymbol = true) {
  if (amount === null || amount === undefined) return showSymbol ? 'Rs. 0.00' : '0.00'

  const num = new Decimal(amount)
  const formatted = num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return showSymbol ? `Rs. ${formatted}` : formatted
}

/**
 * Format number with commas
 * @param {number|string} num
 * @param {number} decimals
 * @returns {string}
 */
export function formatNumber(num, decimals = 2) {
  if (num === null || num === undefined) return '0'

  const decimal = new Decimal(num)
  return decimal.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Format date
 * @param {Date|string} date
 * @param {string} format
 * @returns {string}
 */
export function formatDate(date, format = 'DD-MMM-YYYY') {
  if (!date) return ''
  return dayjs(date).format(format)
}

/**
 * Format date and time
 * @param {Date|string} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return ''
  return dayjs(date).format('DD-MMM-YYYY hh:mm A')
}

/**
 * Parse currency string to number
 * @param {string} str
 * @returns {number}
 */
export function parseCurrency(str) {
  if (!str) return 0
  const cleaned = str.toString().replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Format percentage
 * @param {number} value
 * @param {number} decimals
 * @returns {string}
 */
export function formatPercentage(value, decimals = 2) {
  if (value === null || value === undefined) return '0%'
  return `${new Decimal(value).toFixed(decimals)}%`
}

/**
 * Generate auto number (invoice number, etc.)
 * @param {string} prefix - E.g., 'INV', 'PUR', 'EMP'
 * @param {number} number - Sequential number
 * @param {number} digits - Padding digits
 * @returns {string}
 */
export function generateAutoNumber(prefix, number, digits = 4) {
  const year = new Date().getFullYear()
  const padded = number.toString().padStart(digits, '0')
  return `${prefix}-${year}-${padded}`
}

/**
 * Format number in words (for invoices)
 * @param {number} num
 * @returns {string}
 */
export function numberToWords(num) {
  // Simplified version - can be enhanced
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  if (num === 0) return 'Zero'

  let words = ''
  const crores = Math.floor(num / 10000000)
  const lakhs = Math.floor((num % 10000000) / 100000)
  const thousands = Math.floor((num % 100000) / 1000)
  const hundreds = Math.floor((num % 1000) / 100)
  const remainder = num % 100

  if (crores > 0) words += convertToWords(crores) + ' Crore '
  if (lakhs > 0) words += convertToWords(lakhs) + ' Lakh '
  if (thousands > 0) words += convertToWords(thousands) + ' Thousand '
  if (hundreds > 0) words += ones[hundreds] + ' Hundred '
  if (remainder > 0) {
    if (remainder < 10) words += ones[remainder]
    else if (remainder < 20) words += teens[remainder - 10]
    else {
      words += tens[Math.floor(remainder / 10)]
      if (remainder % 10 > 0) words += ' ' + ones[remainder % 10]
    }
  }

  return words.trim() + ' Only'
}

function convertToWords(n) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

  if (n < 10) return ones[n]
  if (n < 20) return teens[n - 10]
  if (n < 100) {
    return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '')
  }
  return ''
}
