/**
 * Item Validation Schemas
 * Zod schemas for item/product validation
 */

import { z } from 'zod'

// Unit of measure enum
export const unitOfMeasureSchema = z.enum(
  ['Pcs', 'Kg', 'Liter', 'Meter', 'Box', 'Dozen', 'Carton', 'Pack'],
  {
    errorMap: () => ({ message: 'Invalid unit of measure' }),
  }
)

// Item code validation
export const itemCodeSchema = z
  .string()
  .min(1, 'Item code is required')
  .max(20, 'Item code must be at most 20 characters')
  .regex(/^[A-Z0-9-]+$/, 'Item code must contain only uppercase letters, numbers, and hyphens')
  .trim()

// Item name validation
export const itemNameSchema = z
  .string()
  .min(2, 'Item name must be at least 2 characters')
  .max(200, 'Item name must be at most 200 characters')
  .trim()

// Create item schema
export const createItemSchema = z.object({
  item_code: itemCodeSchema,
  item_name: itemNameSchema,
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  category_id: z.string().optional().nullable(),
  unit_of_measure: unitOfMeasureSchema.default('Pcs'),

  // Initial stock (optional, can be set later through stock movement)
  registered_qty: z.number().min(0, 'Quantity cannot be negative').optional().default(0),
  unregistered_qty: z.number().min(0, 'Quantity cannot be negative').optional().default(0),

  // Costs
  cost_registered: z.number().min(0, 'Cost cannot be negative').optional().default(0),
  cost_unregistered: z.number().min(0, 'Cost cannot be negative').optional().default(0),

  // Pricing
  selling_price: z.number().min(0, 'Selling price cannot be negative').optional().default(0),

  // Stock control
  reorder_level: z.number().min(0, 'Reorder level cannot be negative').optional().default(0),
  reorder_qty: z.number().min(0, 'Reorder quantity cannot be negative').optional().default(0),

  // FBR
  hs_code: z.string().max(20, 'HS Code must be at most 20 characters').optional(),
  tax_rate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100').optional().default(18),

  // Image
  image_url: z.string().url('Invalid image URL').optional(),
})

// Update item schema
export const updateItemSchema = z.object({
  item_code: itemCodeSchema.optional(),
  item_name: itemNameSchema.optional(),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
  category_id: z.string().optional().nullable(),
  unit_of_measure: unitOfMeasureSchema.optional(),

  // Note: Stock quantities should NOT be updated directly
  // They should be updated through stock movement transactions
  // Including these fields here for completeness, but API should reject direct updates

  // Costs (can be updated for valuation purposes)
  cost_registered: z.number().min(0, 'Cost cannot be negative').optional(),
  cost_unregistered: z.number().min(0, 'Cost cannot be negative').optional(),

  // Pricing
  selling_price: z.number().min(0, 'Selling price cannot be negative').optional(),

  // Stock control
  reorder_level: z.number().min(0, 'Reorder level cannot be negative').optional(),
  reorder_qty: z.number().min(0, 'Reorder quantity cannot be negative').optional(),

  // FBR
  hs_code: z.string().max(20, 'HS Code must be at most 20 characters').optional(),
  tax_rate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100').optional(),

  // Image
  image_url: z.string().url('Invalid image URL').optional(),

  // Status
  is_active: z.boolean().optional(),
})

// Query params validation
export const itemQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
  category_id: z.string().optional(),
  is_active: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
  low_stock: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
})

export default {
  unitOfMeasureSchema,
  itemCodeSchema,
  itemNameSchema,
  createItemSchema,
  updateItemSchema,
  itemQuerySchema,
}
