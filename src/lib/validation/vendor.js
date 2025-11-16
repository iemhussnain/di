/**
 * Vendor Validation Schemas
 * Zod schemas for validating vendor data
 */

import { z } from 'zod'

// Vendor code validation
export const vendorCodeSchema = z
  .string()
  .regex(/^VEN-\d{5}$/, 'Vendor code must be in format: VEN-00001')
  .optional()

// Vendor name validation
export const vendorNameSchema = z
  .string()
  .min(2, 'Vendor name must be at least 2 characters')
  .max(100, 'Vendor name must not exceed 100 characters')
  .trim()

// NTN validation (7 digits)
export const ntnSchema = z
  .string()
  .regex(/^[0-9]{7}$/, 'NTN must be 7 digits')
  .optional()

// STRN validation (XX-XX-XXXX-XXX-XX)
export const strnSchema = z
  .string()
  .regex(/^[0-9]{2}-[0-9]{2}-[0-9]{4}-[0-9]{3}-[0-9]{2}$/, 'STRN must be in format: 12-34-5678-901-23')
  .optional()

// Phone validation
export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^[\d\s\-+()]+$/, 'Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign')

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .optional()
  .or(z.literal(''))

// Address sub-schema
export const addressSchema = z.object({
  street: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(50).optional().or(z.literal('')),
  province: z.string().max(50).optional().or(z.literal('')),
  country: z.string().max(50).default('Pakistan'),
  postal_code: z.string().max(10).optional().or(z.literal('')),
})

// Payment terms validation
export const paymentTermsSchema = z.enum(['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90'])

// Balance validation
export const balanceSchema = z.number().default(0)

// Status validation
export const statusSchema = z.enum(['Active', 'Inactive', 'Blocked']).default('Active')

// Main vendor creation schema
export const createVendorSchema = z
  .object({
    vendor_code: vendorCodeSchema.optional(),
    vendor_name: vendorNameSchema,
    is_registered: z.boolean().default(false),
    ntn: ntnSchema,
    strn: strnSchema,
    phone: phoneSchema,
    email: emailSchema,
    address: addressSchema.optional(),
    payment_terms: paymentTermsSchema.default('Cash'),
    opening_balance: balanceSchema,
    current_balance: balanceSchema,
    status: statusSchema,
    notes: z.string().max(500).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // If registered, must have either NTN or STRN
      if (data.is_registered) {
        return data.ntn || data.strn
      }
      return true
    },
    {
      message: 'Registered vendors must have either NTN or STRN',
      path: ['ntn'],
    }
  )

// Vendor update schema (all fields optional except vendor_name)
export const updateVendorSchema = z
  .object({
    vendor_name: vendorNameSchema.optional(),
    is_registered: z.boolean().optional(),
    ntn: ntnSchema,
    strn: strnSchema,
    phone: phoneSchema.optional(),
    email: emailSchema,
    address: addressSchema.optional(),
    payment_terms: paymentTermsSchema.optional(),
    opening_balance: balanceSchema.optional(),
    current_balance: balanceSchema.optional(),
    status: statusSchema.optional(),
    notes: z.string().max(500).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      // If registered, must have either NTN or STRN
      if (data.is_registered) {
        return data.ntn || data.strn
      }
      return true
    },
    {
      message: 'Registered vendors must have either NTN or STRN',
      path: ['ntn'],
    }
  )

// Vendor ID validation (MongoDB ObjectId)
export const vendorIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vendor ID')

// Query parameters schema for list endpoint
export const vendorQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  search: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Blocked', 'all']).optional(),
  is_registered: z.enum(['true', 'false', 'all']).optional(),
  sort_by: z.enum(['vendor_name', 'vendor_code', 'createdAt', 'current_balance']).default('vendor_code'),
  order: z.enum(['asc', 'desc']).default('asc'),
})
