/**
 * Custom hooks for vendor data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all vendors with filters and pagination
 */
export function useVendors(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['vendors', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/vendors?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single vendor by ID
 */
export function useVendor(id) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const { data } = await api.get(`/vendors/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch active vendors only
 */
export function useActiveVendors() {
  return useQuery({
    queryKey: ['vendors', { status: 'active' }],
    queryFn: async () => {
      const { data } = await api.get('/vendors?status=active')
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Create new vendor
 */
export function useCreateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vendorData) => {
      const { data } = await api.post('/vendors', vendorData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create vendor')
    },
  })
}

/**
 * Update vendor
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...vendorData }) => {
      const { data } = await api.put(`/vendors/${id}`, vendorData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update vendor')
    },
  })
}

/**
 * Delete vendor
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/vendors/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      toast.success('Vendor deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete vendor')
    },
  })
}

/**
 * Fetch vendor purchase history
 */
export function useVendorPurchases(vendorId, filters = {}) {
  return useQuery({
    queryKey: ['vendor-purchases', vendorId, filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      )
      const { data } = await api.get(`/vendors/${vendorId}/purchases?${params}`)
      return data
    },
    enabled: !!vendorId,
  })
}

/**
 * Fetch vendor outstanding balance
 */
export function useVendorBalance(vendorId) {
  return useQuery({
    queryKey: ['vendor-balance', vendorId],
    queryFn: async () => {
      const { data } = await api.get(`/vendors/${vendorId}/balance`)
      return data
    },
    enabled: !!vendorId,
  })
}
