/**
 * Custom hooks for HR attendance management using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tantml:react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all attendance records with filters and pagination
 */
export function useAttendance(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['attendance', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/attendance?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single attendance record by ID
 */
export function useAttendanceRecord(id) {
  return useQuery({
    queryKey: ['attendance-record', id],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch attendance for a specific date
 */
export function useDailyAttendance(date) {
  return useQuery({
    queryKey: ['attendance', 'daily', date],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/daily?date=${date}`)
      return data
    },
    enabled: !!date,
    staleTime: 60 * 1000, // 1 minute - attendance data changes frequently
  })
}

/**
 * Fetch attendance for a specific month
 */
export function useMonthlyAttendance(month, year, employeeId = null) {
  return useQuery({
    queryKey: ['attendance', 'monthly', month, year, employeeId],
    queryFn: async () => {
      const params = new URLSearchParams({
        month: month.toString(),
        year: year.toString(),
      })
      if (employeeId) params.append('employee_id', employeeId)
      const { data } = await api.get(`/attendance/monthly?${params}`)
      return data
    },
    enabled: !!month && !!year,
  })
}

/**
 * Fetch attendance summary (statistics)
 */
export function useAttendanceSummary(startDate, endDate, employeeId = null) {
  return useQuery({
    queryKey: ['attendance-summary', startDate, endDate, employeeId],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })
      if (employeeId) params.append('employee_id', employeeId)
      const { data } = await api.get(`/attendance/summary?${params}`)
      return data
    },
    enabled: !!startDate && !!endDate,
  })
}

/**
 * Mark attendance (check-in/check-out)
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attendanceData) => {
      const { data } = await api.post('/attendance/mark', attendanceData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
      toast.success('Attendance marked successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to mark attendance')
    },
  })
}

/**
 * Bulk mark attendance
 */
export function useBulkMarkAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attendanceData) => {
      const { data } = await api.post('/attendance/bulk-mark', attendanceData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
      toast.success('Bulk attendance marked successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to mark bulk attendance')
    },
  })
}

/**
 * Update attendance record
 */
export function useUpdateAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...attendanceData }) => {
      const { data } = await api.put(`/attendance/${id}`, attendanceData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-record', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
      toast.success('Attendance updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update attendance')
    },
  })
}

/**
 * Delete attendance record
 */
export function useDeleteAttendance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/attendance/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-summary'] })
      toast.success('Attendance deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete attendance')
    },
  })
}

/**
 * Approve attendance correction request
 */
export function useApproveAttendanceCorrection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, remarks }) => {
      const { data } = await api.post(`/attendance/${id}/approve-correction`, { remarks })
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-record', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Attendance correction approved!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to approve correction')
    },
  })
}

/**
 * Fetch employees present today
 */
export function useEmployeesPresent() {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['employees-present', today],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/present?date=${today}`)
      return data
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })
}

/**
 * Fetch employees absent today
 */
export function useEmployeesAbsent() {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['employees-absent', today],
    queryFn: async () => {
      const { data } = await api.get(`/attendance/absent?date=${today}`)
      return data
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })
}
