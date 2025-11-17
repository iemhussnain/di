/**
 * Payment Validation Schemas
 * Zod validation for payment operations
 */

import { z } from 'zod'

// Create Payment Schema
export const createPaymentSchema = z.object({
  payment_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid payment date'),
  payment_type: z.enum(['Receipt', 'Payment'], {
    required_error: 'Payment type is required',
  }),
  party_type: z.enum(['Customer', 'Vendor'], {
    required_error: 'Party type is required',
  }),
  party_id: z.string().min(1, 'Party is required'),
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
  bank_name: z.string().optional(),
  cheque_no: z.string().optional(),
  transaction_ref: z.string().optional(),
  invoice_type: z.enum(['SalesInvoice', 'PurchaseInvoice']).optional(),
  invoice_id: z.string().optional(),
  account_id: z.string().min(1, 'Account is required'),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  created_by: z.string().min(1, 'Created by is required'),
})

// Update Payment Schema
export const updatePaymentSchema = z.object({
  payment_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid payment date').optional(),
  payment_type: z.enum(['Receipt', 'Payment']).optional(),
  party_type: z.enum(['Customer', 'Vendor']).optional(),
  party_id: z.string().min(1, 'Party is required').optional(),
  amount: z.number().positive('Payment amount must be greater than 0').optional(),
  payment_method: z
    .enum(['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card', 'Online Payment'])
    .optional(),
  bank_name: z.string().optional(),
  cheque_no: z.string().optional(),
  transaction_ref: z.string().optional(),
  invoice_type: z.enum(['SalesInvoice', 'PurchaseInvoice']).optional(),
  invoice_id: z.string().optional(),
  account_id: z.string().min(1, 'Account is required').optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

// Post Payment Schema
export const postPaymentSchema = z.object({
  posted_by: z.string().min(1, 'User ID is required'),
})

// Cancel Payment Schema
export const cancelPaymentSchema = z.object({
  cancelled_by: z.string().min(1, 'User ID is required'),
  cancellation_reason: z.string().min(1, 'Cancellation reason is required'),
})

// Query parameters validation
export const paymentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  payment_type: z.enum(['Receipt', 'Payment']).optional(),
  party_type: z.enum(['Customer', 'Vendor']).optional(),
  party_id: z.string().optional(),
  status: z.enum(['Draft', 'Posted', 'Reconciled', 'Cancelled']).optional(),
  posted: z.enum(['true', 'false']).transform((val) => val === 'true').optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  search: z.string().optional(),
})
