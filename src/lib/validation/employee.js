/**
 * Employee Validation Schemas
 * Zod schemas for validating employee data
 */

import { z } from 'zod'

// Employee code validation
export const employeeCodeSchema = z
  .string()
  .regex(/^EMP-\d{5}$/, 'Employee code must be in format: EMP-00001')
  .optional()

// Full name validation
export const fullNameSchema = z
  .string()
  .min(2, 'Full name must be at least 2 characters')
  .max(100, 'Full name must not exceed 100 characters')
  .trim()

// CNIC validation (12345-1234567-1)
export const cnicSchema = z
  .string()
  .regex(/^[0-9]{5}-[0-9]{7}-[0-9]$/, 'CNIC must be in format: 12345-1234567-1')

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

// Date validation
export const dateSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), 'Invalid date')
  .transform((date) => new Date(date))

// Gender validation
export const genderSchema = z.enum(['Male', 'Female', 'Other']).optional()

// Marital status validation
export const maritalStatusSchema = z.enum(['Single', 'Married', 'Divorced']).optional()

// Address sub-schema
export const addressSchema = z.object({
  street: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(50).optional().or(z.literal('')),
  province: z.string().max(50).optional().or(z.literal('')),
  country: z.string().max(50).default('Pakistan'),
  postal_code: z.string().max(10).optional().or(z.literal('')),
})

// Designation validation
export const designationSchema = z
  .string()
  .min(2, 'Designation must be at least 2 characters')
  .max(100, 'Designation must not exceed 100 characters')
  .trim()

// Employment type validation
export const employmentTypeSchema = z
  .enum(['Permanent', 'Contract', 'Intern'])
  .default('Permanent')

// Salary validation
export const salarySchema = z
  .number()
  .min(0, 'Salary cannot be negative')
  .or(z.string().transform((val) => parseFloat(val)))

// Allowance sub-schema
export const allowanceSchema = z.object({
  name: z.string().min(1, 'Allowance name is required').trim(),
  amount: z
    .number()
    .min(0, 'Allowance amount cannot be negative')
    .or(z.string().transform((val) => parseFloat(val))),
  is_taxable: z.boolean().default(true),
})

// Status validation
export const statusSchema = z.enum(['Active', 'Resigned', 'Terminated']).default('Active')

// Main employee creation schema
export const createEmployeeSchema = z.object({
  employee_code: employeeCodeSchema.optional(),
  full_name: fullNameSchema,

  // Personal Info
  cnic: cnicSchema,
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: genderSchema,
  marital_status: maritalStatusSchema,

  // Contact
  phone: phoneSchema,
  email: emailSchema,
  address: addressSchema.optional(),

  // Employment
  department_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional().or(z.literal('')),
  designation: designationSchema,
  employment_type: employmentTypeSchema,
  joining_date: z.string().min(1, 'Joining date is required'),

  // Salary Structure
  basic_salary: salarySchema,
  allowances: z.array(allowanceSchema).optional().default([]),

  // Bank Details
  bank_account: z.string().max(50).optional().or(z.literal('')),
  bank_name: z.string().max(100).optional().or(z.literal('')),

  // Tax Details
  eobi_number: z.string().max(50).optional().or(z.literal('')),
  social_security_no: z.string().max(50).optional().or(z.literal('')),
  tax_exemption: salarySchema.optional().default(0),

  // Status
  status: statusSchema,
  resignation_date: z.string().optional().or(z.literal('')),

  notes: z.string().max(500).optional().or(z.literal('')),
})

// Employee update schema (all fields optional except full_name and cnic)
export const updateEmployeeSchema = z.object({
  full_name: fullNameSchema.optional(),

  // Personal Info
  cnic: cnicSchema.optional(),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: genderSchema,
  marital_status: maritalStatusSchema,

  // Contact
  phone: phoneSchema.optional(),
  email: emailSchema,
  address: addressSchema.optional(),

  // Employment
  department_id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID').optional().or(z.literal('')),
  designation: designationSchema.optional(),
  employment_type: employmentTypeSchema.optional(),
  joining_date: z.string().optional(),

  // Salary Structure
  basic_salary: salarySchema.optional(),
  allowances: z.array(allowanceSchema).optional(),

  // Bank Details
  bank_account: z.string().max(50).optional().or(z.literal('')),
  bank_name: z.string().max(100).optional().or(z.literal('')),

  // Tax Details
  eobi_number: z.string().max(50).optional().or(z.literal('')),
  social_security_no: z.string().max(50).optional().or(z.literal('')),
  tax_exemption: salarySchema.optional(),

  // Status
  status: statusSchema.optional(),
  resignation_date: z.string().optional().or(z.literal('')),

  notes: z.string().max(500).optional().or(z.literal('')),
})

// Employee ID validation (MongoDB ObjectId)
export const employeeIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid employee ID')

// Query parameters schema for list endpoint
export const employeeQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  search: z.string().optional(),
  status: z.enum(['Active', 'Resigned', 'Terminated', 'all']).optional(),
  employment_type: z.enum(['Permanent', 'Contract', 'Intern', 'all']).optional(),
  department_id: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  sort_by: z.enum(['full_name', 'employee_code', 'joining_date', 'basic_salary']).default('employee_code'),
  order: z.enum(['asc', 'desc']).default('asc'),
})
