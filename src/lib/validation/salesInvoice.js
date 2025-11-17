/**
 * Sales Invoice Validation Schemas
 * Zod validation for sales invoice operations
 */

import { z } from 'zod'

// Sales Invoice Line Schema
export const salesInvoiceLineSchema = z.object({
  item_id: z.string().min(1, 'Item is required'),
  description: z.string().optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price cannot be negative'),
  discount_percentage: z.number().min(0).max(100).default(0),
  discount_amount: z.number().min(0).default(0),
  tax_percentage: z.number().min(0).max(100).default(0),
  tax_amount: z.number().min(0).default(0),
  line_total: z.number().min(0).default(0),
})

// Create Sales Invoice Schema
export const createSalesInvoiceSchema = z.object({
  invoice_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid invoice date'),
  due_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid due date'),
  customer_id: z.string().min(1, 'Customer is required'),
  sales_order_id: z.string().optional(),
  payment_terms: z
    .enum(['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90'])
    .default('Cash'),
  lines: z
    .array(salesInvoiceLineSchema)
    .min(1, 'Invoice must have at least one line item'),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  created_by: z.string().min(1, 'Created by is required'),
})

// Update Sales Invoice Schema
export const updateSalesInvoiceSchema = z.object({
  invoice_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid invoice date').optional(),
  due_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid due date').optional(),
  customer_id: z.string().min(1, 'Customer is required').optional(),
  payment_terms: z.enum(['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90']).optional(),
  lines: z.array(salesInvoiceLineSchema).min(1, 'Invoice must have at least one line item').optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

// Post Sales Invoice Schema
export const postSalesInvoiceSchema = z.object({
  posted_by: z.string().min(1, 'User ID is required'),
})

// Record Payment Schema
export const recordPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  payment_method: z.enum([
    'Cash',
    'Bank Transfer',
    'Cheque',
    'Credit Card',
    'Debit Card',
    'Online Payment',
  ], {
    required_error: 'Payment method is required',
  }),
  account_id: z.string().min(1, 'Cash/Bank account is required'),
  payment_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid payment date').optional(),
  bank_name: z.string().optional(),
  cheque_no: z.string().optional(),
  transaction_ref: z.string().optional(),
  notes: z.string().optional(),
  created_by: z.string().min(1, 'User ID is required'),
})

// Cancel Sales Invoice Schema
export const cancelSalesInvoiceSchema = z.object({
  cancelled_by: z.string().min(1, 'User ID is required'),
  cancellation_reason: z.string().min(1, 'Cancellation reason is required'),
})

// Create Invoice from Sales Order Schema
export const createInvoiceFromOrderSchema = z.object({
  sales_order_id: z.string().min(1, 'Sales order ID is required'),
  invoice_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid invoice date').optional(),
  created_by: z.string().min(1, 'Created by is required'),
})

// Query parameters validation
export const salesInvoiceQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  customer_id: z.string().optional(),
  status: z.enum(['Draft', 'Posted', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled']).optional(),
  posted: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  overdue: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  search: z.string().optional(),
})
