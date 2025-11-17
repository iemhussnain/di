/**
 * Custom hooks for purchase order data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all purchase orders with filters and pagination
 */
export function usePurchaseOrders(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['purchase-orders', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/purchase-orders?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single purchase order by ID
 */
export function usePurchaseOrder(id) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const { data } = await api.get(`/purchase-orders/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Create new purchase order
 */
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData) => {
      const { data } = await api.post('/purchase-orders', orderData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase order created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create purchase order')
    },
  })
}

/**
 * Update purchase order
 */
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...orderData }) => {
      const { data } = await api.put(`/purchase-orders/${id}`, orderData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase order updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update purchase order')
    },
  })
}

/**
 * Delete purchase order
 */
export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/purchase-orders/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase order deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete purchase order')
    },
  })
}

/**
 * Approve purchase order
 */
export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId) => {
      const { data } = await api.post(`/purchase-orders/${orderId}/approve`)
      return data
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      toast.success('Purchase order approved successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to approve purchase order')
    },
  })
}

/**
 * Convert purchase order to invoice
 */
export function useConvertPOToInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId) => {
      const { data } = await api.post(`/purchase-orders/${orderId}/convert-to-invoice`)
      return data
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })
      toast.success('Purchase order converted to invoice successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to convert to invoice')
    },
  })
}
