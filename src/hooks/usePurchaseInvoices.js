/**
 * Custom hooks for purchase invoice data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all purchase invoices with filters and pagination
 */
export function usePurchaseInvoices(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['purchase-invoices', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/purchase-invoices?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single purchase invoice by ID
 */
export function usePurchaseInvoice(id) {
  return useQuery({
    queryKey: ['purchase-invoice', id],
    queryFn: async () => {
      const { data } = await api.get(`/purchase-invoices/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Create new purchase invoice
 */
export function useCreatePurchaseInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceData) => {
      const { data } = await api.post('/purchase-invoices', invoiceData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })
      toast.success('Purchase invoice created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create purchase invoice')
    },
  })
}

/**
 * Update purchase invoice
 */
export function useUpdatePurchaseInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...invoiceData }) => {
      const { data } = await api.put(`/purchase-invoices/${id}`, invoiceData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-invoice', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })
      toast.success('Purchase invoice updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update purchase invoice')
    },
  })
}

/**
 * Delete purchase invoice
 */
export function useDeletePurchaseInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/purchase-invoices/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })
      toast.success('Purchase invoice deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete purchase invoice')
    },
  })
}

/**
 * Post purchase invoice
 */
export function usePostPurchaseInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId) => {
      const { data } = await api.post(`/purchase-invoices/${invoiceId}/post`)
      return data
    },
    onSuccess: (data, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })
      toast.success('Purchase invoice posted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to post purchase invoice')
    },
  })
}

/**
 * Fetch vendor invoices
 */
export function useVendorInvoices(vendorId, filters = {}) {
  return useQuery({
    queryKey: ['vendor-invoices', vendorId, filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      )
      const { data } = await api.get(`/vendors/${vendorId}/invoices?${params}`)
      return data
    },
    enabled: !!vendorId,
  })
}
