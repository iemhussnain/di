/**
 * Custom hooks for customer data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all customers
 */
export function useCustomers(filters = {}) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      )
      const { data } = await api.get(`/customers?${params}`)
      return data
    },
  })
}

/**
 * Fetch registered customers only (with NTN or STRN)
 */
export function useRegisteredCustomers() {
  return useQuery({
    queryKey: ['customers', 'registered'],
    queryFn: async () => {
      const { data } = await api.get('/customers/registered')
      return data
    },
  })
}

/**
 * Fetch single customer by ID
 */
export function useCustomer(id) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const { data } = await api.get(`/customers/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Create new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customerData) => {
      const { data } = await api.post('/customers', customerData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer created successfully!')
    },
  })
}

/**
 * Update customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...customerData }) => {
      const { data } = await api.put(`/customers/${id}`, customerData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer updated successfully!')
    },
  })
}

/**
 * Delete customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/customers/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted successfully!')
    },
  })
}
