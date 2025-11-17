/**
 * Custom hooks for employee (HR) data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all employees with filters and pagination
 */
export function useEmployees(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['employees', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/employees?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single employee by ID
 */
export function useEmployee(id) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      const { data } = await api.get(`/employees/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch active employees only
 */
export function useActiveEmployees() {
  return useQuery({
    queryKey: ['employees', { status: 'active' }],
    queryFn: async () => {
      const { data } = await api.get('/employees?status=active')
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Create new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (employeeData) => {
      const { data } = await api.post('/employees', employeeData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create employee')
    },
  })
}

/**
 * Update employee
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...employeeData }) => {
      const { data } = await api.put(`/employees/${id}`, employeeData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update employee')
    },
  })
}

/**
 * Delete employee
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/employees/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      toast.success('Employee deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete employee')
    },
  })
}

/**
 * Fetch employee attendance
 */
export function useEmployeeAttendance(employeeId, filters = {}) {
  return useQuery({
    queryKey: ['employee-attendance', employeeId, filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      )
      const { data } = await api.get(`/employees/${employeeId}/attendance?${params}`)
      return data
    },
    enabled: !!employeeId,
  })
}

/**
 * Fetch employee leaves
 */
export function useEmployeeLeaves(employeeId, filters = {}) {
  return useQuery({
    queryKey: ['employee-leaves', employeeId, filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      )
      const { data } = await api.get(`/employees/${employeeId}/leaves?${params}`)
      return data
    },
    enabled: !!employeeId,
  })
}

/**
 * Fetch employee payroll history
 */
export function useEmployeePayroll(employeeId, filters = {}) {
  return useQuery({
    queryKey: ['employee-payroll', employeeId, filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      )
      const { data } = await api.get(`/employees/${employeeId}/payroll?${params}`)
      return data
    },
    enabled: !!employeeId,
  })
}
