/**
 * Custom hooks for payment data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all payments with filters and pagination
 */
export function usePayments(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['payments', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/payments?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single payment by ID
 */
export function usePayment(id) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      const { data } = await api.get(`/payments/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch payments for a specific invoice
 */
export function useInvoicePayments(invoiceId) {
  return useQuery({
    queryKey: ['invoice-payments', invoiceId],
    queryFn: async () => {
      const { data } = await api.get(`/invoices/${invoiceId}/payments`)
      return data
    },
    enabled: !!invoiceId,
  })
}

/**
 * Create new payment
 */
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (paymentData) => {
      const { data } = await api.post('/payments', paymentData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      if (variables.invoice_id) {
        queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoice_id] })
        queryClient.invalidateQueries({ queryKey: ['invoice-payments', variables.invoice_id] })
      }
      toast.success('Payment recorded successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to record payment')
    },
  })
}

/**
 * Update payment
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...paymentData }) => {
      const { data } = await api.put(`/payments/${id}`, paymentData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Payment updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update payment')
    },
  })
}

/**
 * Delete payment
 */
export function useDeletePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/payments/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Payment deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete payment')
    },
  })
}

/**
 * Fetch payment methods
 */
export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data } = await api.get('/payment-methods')
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - payment methods don't change often
  })
}
