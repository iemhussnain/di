/**
 * Custom hooks for FBR (Federal Board of Revenue) integration using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Verify NTN with FBR
 */
export function useVerifyNTN(ntn) {
  return useQuery({
    queryKey: ['fbr-verify-ntn', ntn],
    queryFn: async () => {
      const { data } = await api.post('/fbr/verify-ntn', { ntn })
      return data
    },
    enabled: !!ntn && ntn.length >= 7,
    staleTime: 60 * 60 * 1000, // 1 hour - NTN verification results don't change often
    retry: 2,
  })
}

/**
 * Verify STRN with FBR
 */
export function useVerifySTRN(strn) {
  return useQuery({
    queryKey: ['fbr-verify-strn', strn],
    queryFn: async () => {
      const { data } = await api.post('/fbr/verify-strn', { strn })
      return data
    },
    enabled: !!strn && strn.length >= 7,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
  })
}

/**
 * Submit invoice to FBR
 */
export function useSubmitInvoiceToFBR() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoiceId) => {
      const { data } = await api.post(`/fbr/submit-invoice/${invoiceId}`)
      return data
    },
    onSuccess: (data, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['fbr-submissions'] })
      toast.success('Invoice submitted to FBR successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to submit invoice to FBR')
    },
  })
}

/**
 * Fetch FBR submission history
 */
export function useFBRSubmissions(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['fbr-submissions', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/fbr/submissions?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch FBR submission status
 */
export function useFBRSubmissionStatus(submissionId) {
  return useQuery({
    queryKey: ['fbr-submission-status', submissionId],
    queryFn: async () => {
      const { data } = await api.get(`/fbr/submissions/${submissionId}/status`)
      return data
    },
    enabled: !!submissionId,
    refetchInterval: (data) => {
      // Auto-refresh every 30 seconds if status is pending
      if (data?.status === 'pending') return 30 * 1000
      return false
    },
  })
}

/**
 * Generate FBR sales tax report
 */
export function useFBRSalesTaxReport(month, year) {
  return useQuery({
    queryKey: ['fbr-sales-tax-report', month, year],
    queryFn: async () => {
      const { data } = await api.get(`/fbr/reports/sales-tax?month=${month}&year=${year}`)
      return data
    },
    enabled: !!month && !!year,
  })
}

/**
 * Generate FBR withholding tax report
 */
export function useFBRWithholdingTaxReport(month, year) {
  return useQuery({
    queryKey: ['fbr-withholding-tax-report', month, year],
    queryFn: async () => {
      const { data } = await api.get(`/fbr/reports/withholding-tax?month=${month}&year=${year}`)
      return data
    },
    enabled: !!month && !!year,
  })
}

/**
 * Test FBR connection
 */
export function useTestFBRConnection() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/fbr/test-connection')
      return data
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('FBR connection successful!')
      } else {
        toast.error('FBR connection failed')
      }
    },
    onError: () => {
      toast.error('FBR connection test failed')
    },
  })
}

/**
 * Sync FBR tax rates
 */
export function useSyncFBRTaxRates() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/fbr/sync-tax-rates')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-rates'] })
      toast.success('Tax rates synced with FBR successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to sync tax rates')
    },
  })
}

/**
 * Fetch FBR tax rates
 */
export function useFBRTaxRates() {
  return useQuery({
    queryKey: ['fbr-tax-rates'],
    queryFn: async () => {
      const { data } = await api.get('/fbr/tax-rates')
      return data
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })
}

/**
 * Generate FBR annexure C
 */
export function useFBRAnnexureC(startDate, endDate) {
  return useQuery({
    queryKey: ['fbr-annexure-c', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get(`/fbr/reports/annexure-c?start_date=${startDate}&end_date=${endDate}`)
      return data
    },
    enabled: !!startDate && !!endDate,
  })
}

/**
 * Validate invoice for FBR compliance
 */
export function useValidateFBRCompliance() {
  return useMutation({
    mutationFn: async (invoiceData) => {
      const { data } = await api.post('/fbr/validate-invoice', invoiceData)
      return data
    },
    onSuccess: (data) => {
      if (data.isCompliant) {
        toast.success('Invoice is FBR compliant')
      } else {
        toast.error(`Compliance issues: ${data.errors.join(', ')}`)
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to validate compliance')
    },
  })
}
