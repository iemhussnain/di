/**
 * Customer Validation Schemas
 * Zod schemas for customer validation
 */

import { z } from 'zod'

// Customer code validation
export const customerCodeSchema = z
  .string()
  .min(1, 'Customer code is required')
  .max(20, 'Customer code must be at most 20 characters')
  .regex(/^CUST-[0-9]+$/, 'Customer code must follow format: CUST-00001')
  .trim()

// Customer name validation
export const customerNameSchema = z
  .string()
  .min(2, 'Customer name must be at least 2 characters')
  .max(200, 'Customer name must be at most 200 characters')
  .trim()

// Phone validation
export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be at most 20 characters')
  .trim()

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .trim()
  .toLowerCase()
  .optional()

// CNIC validation (Pakistan)
export const cnicSchema = z
  .string()
  .regex(/^[0-9]{5}-[0-9]{7}-[0-9]$/, 'CNIC must be in format: 12345-1234567-1')
  .optional()

// NTN validation (Pakistan)
export const ntnSchema = z
  .string()
  .regex(/^[0-9]{7}$/, 'NTN must be 7 digits')
  .optional()

// STRN validation (Pakistan)
export const strnSchema = z
  .string()
  .regex(/^[0-9]{2}-[0-9]{2}-[0-9]{4}-[0-9]{3}-[0-9]{2}$/, 'STRN must be in format: 12-34-5678-901-23')
  .optional()

// Address schema
export const addressSchema = z.object({
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  country: z.string().max(100).default('Pakistan'),
  postal_code: z.string().max(20).optional(),
})

// Payment terms enum
export const paymentTermsSchema = z.enum(['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90'], {
  errorMap: () => ({ message: 'Invalid payment terms' }),
})

// Customer status enum
export const customerStatusSchema = z.enum(['Active', 'Inactive', 'Blocked'], {
  errorMap: () => ({ message: 'Invalid customer status' }),
})

// Create customer schema
export const createCustomerSchema = z
  .object({
    customer_code: customerCodeSchema.optional(), // Auto-generated if not provided
    customer_name: customerNameSchema,

    // Registration
    is_registered: z.boolean().default(false),
    ntn: ntnSchema,
    strn: strnSchema,

    // Contact
    cnic: cnicSchema,
    phone: phoneSchema,
    email: emailSchema,

    // Address
    address: addressSchema.optional(),

    // Business
    credit_limit: z.number().min(0, 'Credit limit cannot be negative').optional().default(0),
    payment_terms: paymentTermsSchema.default('Cash'),

    // Balances
    opening_balance: z.number().optional().default(0),

    // Status
    status: customerStatusSchema.default('Active'),

    // Notes
    notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
  })
  .refine(
    (data) => {
      // If registered, must have NTN or STRN
      if (data.is_registered) {
        return data.ntn || data.strn
      }
      return true
    },
    {
      message: 'Registered customers must have either NTN or STRN',
      path: ['ntn'],
    }
  )

// Update customer schema
export const updateCustomerSchema = z
  .object({
    customer_code: customerCodeSchema.optional(), // Cannot be changed
    customer_name: customerNameSchema.optional(),

    // Registration
    is_registered: z.boolean().optional(),
    ntn: ntnSchema,
    strn: strnSchema,

    // Contact
    cnic: cnicSchema,
    phone: phoneSchema.optional(),
    email: emailSchema,

    // Address
    address: addressSchema.optional(),

    // Business
    credit_limit: z.number().min(0, 'Credit limit cannot be negative').optional(),
    payment_terms: paymentTermsSchema.optional(),

    // Status
    status: customerStatusSchema.optional(),

    // Notes
    notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),

    // Balance updates should be done through transactions, not direct updates
  })
  .refine(
    (data) => {
      // If registered, must have NTN or STRN
      if (data.is_registered) {
        return data.ntn || data.strn
      }
      return true
    },
    {
      message: 'Registered customers must have either NTN or STRN',
      path: ['ntn'],
    }
  )

// Query params validation
export const customerQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
  status: z.string().optional(),
  is_registered: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
  city: z.string().optional(),
  outstanding: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  credit_exceeded: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
})

export default {
  customerCodeSchema,
  customerNameSchema,
  phoneSchema,
  emailSchema,
  cnicSchema,
  ntnSchema,
  strnSchema,
  addressSchema,
  paymentTermsSchema,
  customerStatusSchema,
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
}
