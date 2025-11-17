/**
 * Custom hooks for journal entries using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all journal entries with filters and pagination
 */
export function useJournalEntries(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['journal-entries', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/journal-entries?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single journal entry by ID
 */
export function useJournalEntry(id) {
  return useQuery({
    queryKey: ['journal-entry', id],
    queryFn: async () => {
      const { data } = await api.get(`/journal-entries/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch unposted journal entries
 */
export function useUnpostedJournalEntries() {
  return useQuery({
    queryKey: ['journal-entries', { status: 'draft' }],
    queryFn: async () => {
      const { data } = await api.get('/journal-entries?status=draft')
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Create new journal entry
 */
export function useCreateJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entryData) => {
      const { data } = await api.post('/journal-entries', entryData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account-balance'] })
      toast.success('Journal entry created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create journal entry')
    },
  })
}

/**
 * Update journal entry
 */
export function useUpdateJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...entryData }) => {
      const { data } = await api.put(`/journal-entries/${id}`, entryData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entry', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account-balance'] })
      toast.success('Journal entry updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update journal entry')
    },
  })
}

/**
 * Post journal entry
 */
export function usePostJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entryId) => {
      const { data } = await api.post(`/journal-entries/${entryId}/post`)
      return data
    },
    onSuccess: (data, entryId) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entry', entryId] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account-balance'] })
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] })
      toast.success('Journal entry posted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to post journal entry')
    },
  })
}

/**
 * Reverse journal entry
 */
export function useReverseJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ entryId, reversalDate, remarks }) => {
      const { data } = await api.post(`/journal-entries/${entryId}/reverse`, {
        reversal_date: reversalDate,
        remarks,
      })
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entry', variables.entryId] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['account-balance'] })
      queryClient.invalidateQueries({ queryKey: ['account-transactions'] })
      toast.success('Journal entry reversed successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to reverse journal entry')
    },
  })
}

/**
 * Delete journal entry (only for draft entries)
 */
export function useDeleteJournalEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/journal-entries/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      toast.success('Journal entry deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete journal entry')
    },
  })
}

/**
 * Fetch journal entry types/templates
 */
export function useJournalEntryTypes() {
  return useQuery({
    queryKey: ['journal-entry-types'],
    queryFn: async () => {
      const { data } = await api.get('/journal-entries/types')
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Fetch general ledger (all journal entries)
 */
export function useGeneralLedger(filters = {}, pagination = { page: 1, limit: 50 }) {
  return useQuery({
    queryKey: ['general-ledger', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/general-ledger?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch trial balance
 */
export function useTrialBalance(asOfDate = null) {
  return useQuery({
    queryKey: ['trial-balance', asOfDate],
    queryFn: async () => {
      const params = asOfDate ? `?as_of_date=${asOfDate}` : ''
      const { data } = await api.get(`/reports/trial-balance${params}`)
      return data
    },
  })
}

/**
 * Fetch balance sheet
 */
export function useBalanceSheet(asOfDate = null) {
  return useQuery({
    queryKey: ['balance-sheet', asOfDate],
    queryFn: async () => {
      const params = asOfDate ? `?as_of_date=${asOfDate}` : ''
      const { data } = await api.get(`/reports/balance-sheet${params}`)
      return data
    },
  })
}

/**
 * Fetch profit & loss statement
 */
export function useProfitLoss(startDate, endDate) {
  return useQuery({
    queryKey: ['profit-loss', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })
      const { data } = await api.get(`/reports/profit-loss?${params}`)
      return data
    },
    enabled: !!startDate && !!endDate,
  })
}
