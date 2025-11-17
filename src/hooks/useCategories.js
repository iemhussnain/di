/**
 * Custom hooks for category data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all categories with filters and pagination
 */
export function useCategories(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['categories', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/categories?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch all categories without pagination (for dropdowns)
 */
export function useAllCategories(type = '') {
  return useQuery({
    queryKey: ['categories', 'all', type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : ''
      const { data } = await api.get(`/categories${params}`)
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  })
}

/**
 * Fetch single category by ID
 */
export function useCategory(id) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: async () => {
      const { data } = await api.get(`/categories/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch product categories
 */
export function useProductCategories() {
  return useQuery({
    queryKey: ['categories', { type: 'product' }],
    queryFn: async () => {
      const { data } = await api.get('/categories?type=product')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Fetch expense categories
 */
export function useExpenseCategories() {
  return useQuery({
    queryKey: ['categories', { type: 'expense' }],
    queryFn: async () => {
      const { data } = await api.get('/categories?type=expense')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Create new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (categoryData) => {
      const { data } = await api.post('/categories', categoryData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create category')
    },
  })
}

/**
 * Update category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...categoryData }) => {
      const { data } = await api.put(`/categories/${id}`, categoryData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update category')
    },
  })
}

/**
 * Delete category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/categories/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete category')
    },
  })
}

/**
 * Fetch items in a category
 */
export function useCategoryItems(categoryId, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['category-items', categoryId, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      const { data } = await api.get(`/categories/${categoryId}/items?${params}`)
      return data
    },
    enabled: !!categoryId,
    keepPreviousData: true,
  })
}
