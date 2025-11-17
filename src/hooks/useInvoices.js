/**
 * Custom hooks for invoice data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch invoices with filters and pagination
 */
export function useInvoices(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['invoices', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v)
        ),
      })

      const { data } = await api.get(`/sales-invoices?${params}`)
      return data
    },
    keepPreviousData: true, // Keep previous data while fetching new page
  })
}

/**
 * Fetch single invoice by ID
 */
export function useInvoice(id) {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const { data } = await api.get(`/sales-invoices/${id}`)
      return data
    },
    enabled: !!id, // Only run if ID exists
  })
}

/**
 * Create new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceData) => {
      const { data } = await api.post('/sales-invoices', invoiceData)
      return data
    },
    onSuccess: (data) => {
      // Invalidate and refetch invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice created successfully!')
      return data
    },
    onError: (error) => {
      // Error toast is handled by axios interceptor
      console.error('Failed to create invoice:', error)
    },
  })
}

/**
 * Update existing invoice
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...invoiceData }) => {
      const { data } = await api.put(`/sales-invoices/${id}`, invoiceData)
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidate specific invoice and list
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice updated successfully!')
      return data
    },
    onError: (error) => {
      console.error('Failed to update invoice:', error)
    },
  })
}

/**
 * Delete invoice
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/sales-invoices/${id}`)
      return data
    },
    onSuccess: () => {
      // Invalidate invoices list
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice deleted successfully!')
    },
    onError: (error) => {
      console.error('Failed to delete invoice:', error)
    },
  })
}

/**
 * Post invoice (change status from Draft to Posted)
 */
export function usePostInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/sales-invoices/${id}/post`)
      return data
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice posted successfully!')
      return data
    },
    onError: (error) => {
      console.error('Failed to post invoice:', error)
    },
  })
}

/**
 * Cancel invoice
 */
export function useCancelInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const { data } = await api.post(`/sales-invoices/${id}/cancel`, { reason })
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice cancelled successfully!')
      return data
    },
    onError: (error) => {
      console.error('Failed to cancel invoice:', error)
    },
  })
}
