/**
 * Category Validation Schemas
 * Zod schemas for category validation
 */

import { z } from 'zod'

// Category name validation
export const categoryNameSchema = z
  .string()
  .min(2, 'Category name must be at least 2 characters')
  .max(100, 'Category name must be at most 100 characters')
  .trim()

// Create category schema
export const createCategorySchema = z.object({
  category_name: categoryNameSchema,
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  parent_id: z.string().optional().nullable(),
})

// Update category schema
export const updateCategorySchema = z.object({
  category_name: categoryNameSchema.optional(),
  description: z.string().max(500, 'Description must be at most 500 characters').optional(),
  parent_id: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
})

// Query params validation
export const categoryQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('50').transform(Number),
  is_active: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
  parent_id: z.string().optional().nullable(),
})

export default {
  categoryNameSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
}
