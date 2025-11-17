/**
 * Custom hooks for accounting accounts (Chart of Accounts) using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all accounts with filters and pagination
 */
export function useAccounts(filters = {}, pagination = { page: 1, limit: 100 }) {
  return useQuery({
    queryKey: ['accounts', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/accounts?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch all accounts (no pagination, for dropdowns)
 */
export function useAllAccounts(type = '') {
  return useQuery({
    queryKey: ['accounts', 'all', type],
    queryFn: async () => {
      const params = type ? `?type=${type}` : ''
      const { data } = await api.get(`/accounts/all${params}`)
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - COA doesn't change often
  })
}

/**
 * Fetch single account by ID
 */
export function useAccount(id) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const { data } = await api.get(`/accounts/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch accounts by type
 */
export function useAccountsByType(type) {
  return useQuery({
    queryKey: ['accounts', 'by-type', type],
    queryFn: async () => {
      const { data } = await api.get(`/accounts?type=${type}`)
      return data
    },
    enabled: !!type,
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Fetch asset accounts
 */
export function useAssetAccounts() {
  return useAccountsByType('Asset')
}

/**
 * Fetch liability accounts
 */
export function useLiabilityAccounts() {
  return useAccountsByType('Liability')
}

/**
 * Fetch equity accounts
 */
export function useEquityAccounts() {
  return useAccountsByType('Equity')
}

/**
 * Fetch revenue accounts
 */
export function useRevenueAccounts() {
  return useAccountsByType('Revenue')
}

/**
 * Fetch expense accounts
 */
export function useExpenseAccounts() {
  return useAccountsByType('Expense')
}

/**
 * Create new account
 */
export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (accountData) => {
      const { data } = await api.post('/accounts', accountData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create account')
    },
  })
}

/**
 * Update account
 */
export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...accountData }) => {
      const { data } = await api.put(`/accounts/${id}`, accountData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update account')
    },
  })
}

/**
 * Delete account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/accounts/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete account')
    },
  })
}

/**
 * Fetch account balance
 */
export function useAccountBalance(id, asOfDate = null) {
  return useQuery({
    queryKey: ['account-balance', id, asOfDate],
    queryFn: async () => {
      const params = asOfDate ? `?as_of_date=${asOfDate}` : ''
      const { data } = await api.get(`/accounts/${id}/balance${params}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch account transactions
 */
export function useAccountTransactions(id, filters = {}, pagination = { page: 1, limit: 50 }) {
  return useQuery({
    queryKey: ['account-transactions', id, filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/accounts/${id}/transactions?${params}`)
      return data
    },
    enabled: !!id,
    keepPreviousData: true,
  })
}

/**
 * Fetch chart of accounts (hierarchical structure)
 */
export function useChartOfAccounts() {
  return useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: async () => {
      const { data } = await api.get('/accounts/chart')
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}
