/**
 * Custom hooks for HR payroll management using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all payroll records with filters and pagination
 */
export function usePayrolls(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['payrolls', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/payrolls?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single payroll record by ID
 */
export function usePayroll(id) {
  return useQuery({
    queryKey: ['payroll', id],
    queryFn: async () => {
      const { data } = await api.get(`/payrolls/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch payroll for specific month and year
 */
export function useMonthlyPayroll(month, year) {
  return useQuery({
    queryKey: ['payrolls', 'monthly', month, year],
    queryFn: async () => {
      const { data } = await api.get(`/payrolls/monthly?month=${month}&year=${year}`)
      return data
    },
    enabled: !!month && !!year,
  })
}

/**
 * Fetch pending payrolls (not yet processed)
 */
export function usePendingPayrolls() {
  return useQuery({
    queryKey: ['payrolls', { status: 'pending' }],
    queryFn: async () => {
      const { data } = await api.get('/payrolls?status=pending')
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Calculate payroll for a period
 */
export function useCalculatePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ month, year, employeeIds }) => {
      const { data } = await api.post('/payrolls/calculate', {
        month,
        year,
        employee_ids: employeeIds,
      })
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      queryClient.invalidateQueries({
        queryKey: ['payrolls', 'monthly', variables.month, variables.year]
      })
      toast.success('Payroll calculated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to calculate payroll')
    },
  })
}

/**
 * Create payroll record
 */
export function useCreatePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payrollData) => {
      const { data } = await api.post('/payrolls', payrollData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      toast.success('Payroll record created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create payroll record')
    },
  })
}

/**
 * Update payroll record
 */
export function useUpdatePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payrollData }) => {
      const { data } = await api.put(`/payrolls/${id}`, payrollData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payroll', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      toast.success('Payroll record updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update payroll record')
    },
  })
}

/**
 * Process payroll (mark as paid)
 */
export function useProcessPayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, paymentDate, paymentMethod }) => {
      const { data } = await api.post(`/payrolls/${id}/process`, {
        payment_date: paymentDate,
        payment_method: paymentMethod,
      })
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payroll', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      toast.success('Payroll processed successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to process payroll')
    },
  })
}

/**
 * Process bulk payroll
 */
export function useProcessBulkPayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ payrollIds, paymentDate, paymentMethod }) => {
      const { data } = await api.post('/payrolls/process-bulk', {
        payroll_ids: payrollIds,
        payment_date: paymentDate,
        payment_method: paymentMethod,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      toast.success('Bulk payroll processed successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to process bulk payroll')
    },
  })
}

/**
 * Delete payroll record
 */
export function useDeletePayroll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/payrolls/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      toast.success('Payroll record deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete payroll record')
    },
  })
}

/**
 * Fetch payroll summary for a period
 */
export function usePayrollSummary(month, year) {
  return useQuery({
    queryKey: ['payroll-summary', month, year],
    queryFn: async () => {
      const { data } = await api.get(`/payrolls/summary?month=${month}&year=${year}`)
      return data
    },
    enabled: !!month && !!year,
  })
}
