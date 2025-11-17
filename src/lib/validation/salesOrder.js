/**
 * Sales Order Validation Schemas
 * Zod validation for sales order operations
 */

import { z } from 'zod'

// Sales Order Line Schema
export const salesOrderLineSchema = z.object({
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

// Create Sales Order Schema
export const createSalesOrderSchema = z.object({
  order_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid order date'),
  customer_id: z.string().min(1, 'Customer is required'),
  expected_delivery_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid delivery date')
    .optional(),
  shipping_address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      country: z.string().default('Pakistan'),
      postal_code: z.string().optional(),
    })
    .optional(),
  payment_terms: z
    .enum(['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90'])
    .default('Cash'),
  lines: z
    .array(salesOrderLineSchema)
    .min(1, 'Sales order must have at least one line item'),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  created_by: z.string().min(1, 'Created by is required'),
})

// Update Sales Order Schema
export const updateSalesOrderSchema = z.object({
  order_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid order date').optional(),
  customer_id: z.string().min(1, 'Customer is required').optional(),
  expected_delivery_date: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid delivery date')
    .optional(),
  shipping_address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      province: z.string().optional(),
      country: z.string().default('Pakistan'),
      postal_code: z.string().optional(),
    })
    .optional(),
  payment_terms: z.enum(['Cash', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90']).optional(),
  lines: z.array(salesOrderLineSchema).min(1, 'Sales order must have at least one line item').optional(),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
})

// Confirm Sales Order Schema
export const confirmSalesOrderSchema = z.object({
  confirmed_by: z.string().min(1, 'User ID is required'),
})

// Cancel Sales Order Schema
export const cancelSalesOrderSchema = z.object({
  cancelled_by: z.string().min(1, 'User ID is required'),
  cancellation_reason: z.string().min(1, 'Cancellation reason is required'),
})

// Update Delivery Status Schema
export const updateDeliveryStatusSchema = z.object({
  delivered_by: z.string().min(1, 'User ID is required'),
  line_updates: z.array(
    z.object({
      lineId: z.string().min(1, 'Line ID is required'),
      delivered_qty: z.number().min(0, 'Delivered quantity cannot be negative'),
    })
  ).min(1, 'At least one line update is required'),
})

// Query parameters validation
export const salesOrderQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  customer_id: z.string().optional(),
  status: z.enum(['Draft', 'Confirmed', 'Invoiced', 'Partially Delivered', 'Delivered', 'Cancelled']).optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid start date').optional(),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid end date').optional(),
  search: z.string().optional(),
})
