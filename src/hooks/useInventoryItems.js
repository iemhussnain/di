/**
 * Custom hooks for inventory items data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all inventory items with filters and pagination
 */
export function useInventoryItems(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['inventory-items', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/inventory/items?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single inventory item by ID
 */
export function useInventoryItem(id) {
  return useQuery({
    queryKey: ['inventory-item', id],
    queryFn: async () => {
      const { data } = await api.get(`/inventory/items/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch low stock items
 */
export function useLowStockItems() {
  return useQuery({
    queryKey: ['inventory-items', { low_stock: true }],
    queryFn: async () => {
      const { data } = await api.get('/inventory/items?low_stock=true')
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stock levels change frequently
  })
}

/**
 * Fetch out of stock items
 */
export function useOutOfStockItems() {
  return useQuery({
    queryKey: ['inventory-items', { out_of_stock: true }],
    queryFn: async () => {
      const { data } = await api.get('/inventory/items?out_of_stock=true')
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Create new inventory item
 */
export function useCreateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemData) => {
      const { data } = await api.post('/inventory/items', itemData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      toast.success('Inventory item created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create inventory item')
    },
  })
}

/**
 * Update inventory item
 */
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...itemData }) => {
      const { data } = await api.put(`/inventory/items/${id}`, itemData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-item', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      toast.success('Inventory item updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update inventory item')
    },
  })
}

/**
 * Delete inventory item
 */
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/inventory/items/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      toast.success('Inventory item deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete inventory item')
    },
  })
}

/**
 * Adjust inventory stock
 */
export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, adjustment }) => {
      const { data } = await api.post(`/inventory/items/${itemId}/adjust-stock`, adjustment)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-item', variables.itemId] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      toast.success('Stock adjusted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to adjust stock')
    },
  })
}

/**
 * Fetch item stock history
 */
export function useItemStockHistory(itemId, filters = {}) {
  return useQuery({
    queryKey: ['item-stock-history', itemId, filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      )
      const { data } = await api.get(`/inventory/items/${itemId}/stock-history?${params}`)
      return data
    },
    enabled: !!itemId,
  })
}
