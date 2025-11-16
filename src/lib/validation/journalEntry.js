/**
 * Journal Entry Validation Schemas
 * Zod schemas for validating journal entry data
 */

import { z } from 'zod'

// Journal line schema
export const journalLineSchema = z.object({
  account_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid account ID'),
  debit: z.number().min(0, 'Debit cannot be negative').default(0),
  credit: z.number().min(0, 'Credit cannot be negative').default(0),
  description: z.string().optional().or(z.literal('')),
  metadata: z
    .object({
      is_registered: z.boolean().optional(),
      stock_type: z.string().optional(),
      customer_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
      vendor_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
      employee_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
      item_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    })
    .optional(),
}).refine(
  (data) => {
    // A line cannot have both debit and credit
    if (data.debit > 0 && data.credit > 0) {
      return false
    }
    // A line must have either debit or credit
    if (data.debit === 0 && data.credit === 0) {
      return false
    }
    return true
  },
  {
    message: 'A journal line must have either debit or credit amount, not both',
  }
)

// Entry type validation
export const entryTypeSchema = z.enum([
  'Sales',
  'Purchase',
  'Payment',
  'Receipt',
  'Adjustment',
  'Payroll',
  'Manual',
])

// Entry number validation
export const entryNoSchema = z
  .string()
  .regex(/^JV-\d{4}-\d{4}$/, 'Entry number must be in format: JV-YYYY-0001')
  .optional()

// Create journal entry schema
export const createJournalEntrySchema = z
  .object({
    entry_no: entryNoSchema,
    entry_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
    entry_type: entryTypeSchema,
    reference_type: z.string().optional().or(z.literal('')),
    reference_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().or(z.literal('')),
    reference_no: z.string().optional().or(z.literal('')),
    description: z.string().min(3, 'Description must be at least 3 characters').max(500),
    lines: z
      .array(journalLineSchema)
      .min(2, 'Journal entry must have at least 2 lines')
      .max(100, 'Journal entry cannot have more than 100 lines'),
    created_by: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    notes: z.string().max(1000).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // Calculate totals
      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0)
      const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0)

      // Round to 2 decimal places
      const roundedDebit = Math.round(totalDebit * 100) / 100
      const roundedCredit = Math.round(totalCredit * 100) / 100

      // Check if balanced (within 0.01 tolerance)
      const diff = Math.abs(roundedDebit - roundedCredit)
      return diff <= 0.01
    },
    {
      message: 'Journal entry must be balanced: total debits must equal total credits',
      path: ['lines'],
    }
  )

// Update journal entry schema (only for unposted entries)
export const updateJournalEntrySchema = z
  .object({
    entry_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
    entry_type: entryTypeSchema.optional(),
    reference_type: z.string().optional().or(z.literal('')),
    reference_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().or(z.literal('')),
    reference_no: z.string().optional().or(z.literal('')),
    description: z.string().min(3).max(500).optional(),
    lines: z.array(journalLineSchema).min(2).max(100).optional(),
    notes: z.string().max(1000).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // If lines are being updated, check balance
      if (data.lines) {
        const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0)
        const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0)

        const roundedDebit = Math.round(totalDebit * 100) / 100
        const roundedCredit = Math.round(totalCredit * 100) / 100

        const diff = Math.abs(roundedDebit - roundedCredit)
        return diff <= 0.01
      }
      return true
    },
    {
      message: 'Journal entry must be balanced: total debits must equal total credits',
      path: ['lines'],
    }
  )

// Post journal entry schema
export const postJournalEntrySchema = z.object({
  posted_by: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
})

// Reverse journal entry schema
export const reverseJournalEntrySchema = z.object({
  reversal_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date')
    .optional(),
  created_by: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
})

// Journal entry ID validation
export const journalEntryIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid journal entry ID')

// Query parameters schema for list endpoint
export const journalEntryQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  search: z.string().optional(),
  entry_type: z
    .enum(['Sales', 'Purchase', 'Payment', 'Receipt', 'Adjustment', 'Payroll', 'Manual', 'all'])
    .optional(),
  posted: z.enum(['true', 'false', 'all']).optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  sort_by: z.enum(['entry_no', 'entry_date', 'entry_type', 'total_debit']).default('entry_date'),
  order: z.enum(['asc', 'desc']).default('desc'),
})
