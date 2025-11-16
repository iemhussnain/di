/**
 * Common Validation Schemas using Zod
 * Reusable validation schemas for the ERP
 */

import { z } from 'zod'

/**
 * NTN (National Tax Number) validation
 * Format: 1234567-8
 */
export const ntnSchema = z
  .string()
  .regex(/^\d{7}-\d{1}$/, 'Invalid NTN format. Expected: 1234567-8')
  .optional()
  .or(z.literal(''))

/**
 * STRN (Sales Tax Registration Number) validation
 * Format: 1234-5678-90
 */
export const strnSchema = z
  .string()
  .regex(/^\d{4}-\d{4}-\d{2}$/, 'Invalid STRN format. Expected: 1234-5678-90')
  .optional()
  .or(z.literal(''))

/**
 * CNIC validation
 * Format: 12345-1234567-1
 */
export const cnicSchema = z
  .string()
  .regex(/^\d{5}-\d{7}-\d{1}$/, 'Invalid CNIC format. Expected: 12345-1234567-1')
  .optional()
  .or(z.literal(''))

/**
 * Phone number validation (Pakistan)
 */
export const phoneSchema = z
  .string()
  .regex(/^(\+92|0)?3\d{9}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''))

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email format').optional().or(z.literal(''))

/**
 * Positive number validation
 */
export const positiveNumberSchema = z.number().positive('Must be a positive number')

/**
 * Non-negative number validation
 */
export const nonNegativeNumberSchema = z.number().nonnegative('Cannot be negative')

/**
 * Amount validation (for currency)
 */
export const amountSchema = z
  .number()
  .nonnegative('Amount cannot be negative')
  .multipleOf(0.01, 'Amount must have at most 2 decimal places')

/**
 * Percentage validation (0-100)
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be less than 0')
  .max(100, 'Percentage cannot be more than 100')

/**
 * Date validation
 */
export const dateSchema = z.date().or(z.string().datetime())

/**
 * Account type enum
 */
export const accountTypeSchema = z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'])

/**
 * Normal balance enum
 */
export const normalBalanceSchema = z.enum(['Debit', 'Credit'])

/**
 * Status enum
 */
export const statusSchema = z.enum(['Active', 'Inactive', 'Blocked', 'Deleted'])

/**
 * Invoice status enum
 */
export const invoiceStatusSchema = z.enum(['Draft', 'Posted', 'Paid', 'Partial', 'Cancelled'])

/**
 * Payment status enum
 */
export const paymentStatusSchema = z.enum(['Unpaid', 'Partial', 'Paid'])

/**
 * Payment method enum
 */
export const paymentMethodSchema = z.enum(['Cash', 'Bank', 'Cheque', 'Online'])

/**
 * Stock type enum
 */
export const stockTypeSchema = z.enum(['Registered', 'Unregistered'])

/**
 * Movement type enum
 */
export const movementTypeSchema = z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'])

/**
 * Entry type enum
 */
export const entryTypeSchema = z.enum(['Sales', 'Purchase', 'Payment', 'Receipt', 'Adjustment', 'Payroll', 'Manual'])

/**
 * Validate if total debits equal total credits
 */
export function validateDoubleEntry(lines) {
  const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0)
  const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0)

  const diff = Math.abs(totalDebit - totalCredit)

  // Allow 0.01 difference due to rounding
  return diff < 0.01
}

/**
 * Common validation messages
 */
export const validationMessages = {
  required: 'This field is required',
  invalidFormat: 'Invalid format',
  mustBePositive: 'Must be a positive number',
  mustBeUnique: 'This value already exists',
  notFound: 'Record not found',
  cannotDelete: 'Cannot delete this record as it is being used',
  cannotEdit: 'Cannot edit posted transaction',
  notBalanced: 'Debits must equal credits',
}
