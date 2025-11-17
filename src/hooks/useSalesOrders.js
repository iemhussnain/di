/**
 * Custom hooks for sales order data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all sales orders with filters and pagination
 */
export function useSalesOrders(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['sales-orders', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/sales-orders?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single sales order by ID
 */
export function useSalesOrder(id) {
  return useQuery({
    queryKey: ['sales-order', id],
    queryFn: async () => {
      const { data } = await api.get(`/sales-orders/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Create new sales order
 */
export function useCreateSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderData) => {
      const { data } = await api.post('/sales-orders', orderData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      toast.success('Sales order created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create sales order')
    },
  })
}

/**
 * Update sales order
 */
export function useUpdateSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...orderData }) => {
      const { data } = await api.put(`/sales-orders/${id}`, orderData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sales-order', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      toast.success('Sales order updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update sales order')
    },
  })
}

/**
 * Delete sales order
 */
export function useDeleteSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/sales-orders/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      toast.success('Sales order deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete sales order')
    },
  })
}

/**
 * Convert sales order to invoice
 */
export function useConvertOrderToInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId) => {
      const { data } = await api.post(`/sales-orders/${orderId}/convert-to-invoice`)
      return data
    },
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['sales-order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Order converted to invoice successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to convert order to invoice')
    },
  })
}
