/**
 * Account Validation Schemas
 * Zod schemas for Chart of Accounts validation
 */

import { z } from 'zod'

// Account type enum
export const accountTypeSchema = z.enum(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'], {
  errorMap: () => ({ message: 'Invalid account type' }),
})

// Normal balance enum
export const normalBalanceSchema = z.enum(['Debit', 'Credit'], {
  errorMap: () => ({ message: 'Normal balance must be either Debit or Credit' }),
})

// Account code validation - alphanumeric, 1-10 characters
export const accountCodeSchema = z
  .string()
  .min(1, 'Account code is required')
  .max(10, 'Account code must be at most 10 characters')
  .regex(/^[A-Z0-9-]+$/, 'Account code must contain only uppercase letters, numbers, and hyphens')
  .trim()

// Account name validation
export const accountNameSchema = z
  .string()
  .min(3, 'Account name must be at least 3 characters')
  .max(100, 'Account name must be at most 100 characters')
  .trim()

// Create account schema
export const createAccountSchema = z
  .object({
    account_code: accountCodeSchema,
    account_name: accountNameSchema,
    account_type: accountTypeSchema,
    parent_id: z.string().optional().nullable(),
    is_header: z.boolean().default(false),
    normal_balance: normalBalanceSchema,
    opening_balance: z.number().optional().default(0),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  })
  .refine(
    (data) => {
      // If is_header is true, opening_balance should be 0
      if (data.is_header && data.opening_balance !== 0) {
        return false
      }
      return true
    },
    {
      message: 'Header accounts cannot have opening balance',
      path: ['opening_balance'],
    }
  )

// Update account schema (all fields optional except those that shouldn't change)
export const updateAccountSchema = z
  .object({
    account_code: accountCodeSchema.optional(),
    account_name: accountNameSchema.optional(),
    // account_type cannot be changed if account has transactions
    account_type: accountTypeSchema.optional(),
    parent_id: z.string().optional().nullable(),
    is_header: z.boolean().optional(),
    normal_balance: normalBalanceSchema.optional(),
    opening_balance: z.number().optional(),
    is_active: z.boolean().optional(),
    description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  })
  .refine(
    (data) => {
      // If is_header is true, opening_balance should be 0
      if (data.is_header === true && data.opening_balance && data.opening_balance !== 0) {
        return false
      }
      return true
    },
    {
      message: 'Header accounts cannot have opening balance',
      path: ['opening_balance'],
    }
  )

// Query params validation for listing accounts
export const accountQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
  account_type: accountTypeSchema.optional(),
  is_header: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  is_active: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
  parent_id: z.string().optional().nullable(),
})

// Validation helper function
export const validateAccount = (data, isUpdate = false) => {
  const schema = isUpdate ? updateAccountSchema : createAccountSchema
  return schema.parse(data)
}

// Helper to validate account type and normal balance match
export const validateNormalBalance = (accountType, normalBalance) => {
  const expectedBalance = {
    Asset: 'Debit',
    Expense: 'Debit',
    Liability: 'Credit',
    Equity: 'Credit',
    Revenue: 'Credit',
  }

  return expectedBalance[accountType] === normalBalance
}

// Export all schemas
export default {
  accountTypeSchema,
  normalBalanceSchema,
  accountCodeSchema,
  accountNameSchema,
  createAccountSchema,
  updateAccountSchema,
  accountQuerySchema,
  validateAccount,
  validateNormalBalance,
}
