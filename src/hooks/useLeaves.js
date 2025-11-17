/**
 * Custom hooks for HR leave management using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all leave requests with filters and pagination
 */
export function useLeaves(filters = {}, pagination = { page: 1, limit: 20 }) {
  return useQuery({
    queryKey: ['leaves', filters, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      })
      const { data } = await api.get(`/leaves?${params}`)
      return data
    },
    keepPreviousData: true,
  })
}

/**
 * Fetch single leave request by ID
 */
export function useLeave(id) {
  return useQuery({
    queryKey: ['leave', id],
    queryFn: async () => {
      const { data } = await api.get(`/leaves/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Fetch pending leave requests
 */
export function usePendingLeaves() {
  return useQuery({
    queryKey: ['leaves', { status: 'pending' }],
    queryFn: async () => {
      const { data } = await api.get('/leaves?status=pending')
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - pending leaves update frequently
  })
}

/**
 * Fetch leave balance for an employee
 */
export function useLeaveBalance(employeeId) {
  return useQuery({
    queryKey: ['leave-balance', employeeId],
    queryFn: async () => {
      const { data } = await api.get(`/employees/${employeeId}/leave-balance`)
      return data
    },
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch leave types
 */
export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const { data } = await api.get('/leave-types')
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - leave types rarely change
  })
}

/**
 * Create new leave request
 */
export function useCreateLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leaveData) => {
      const { data } = await api.post('/leaves', leaveData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      if (variables.employee_id) {
        queryClient.invalidateQueries({ queryKey: ['leave-balance', variables.employee_id] })
        queryClient.invalidateQueries({ queryKey: ['employee-leaves', variables.employee_id] })
      }
      toast.success('Leave request created successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to create leave request')
    },
  })
}

/**
 * Update leave request
 */
export function useUpdateLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...leaveData }) => {
      const { data } = await api.put(`/leaves/${id}`, leaveData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Leave request updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update leave request')
    },
  })
}

/**
 * Approve leave request
 */
export function useApproveLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, remarks }) => {
      const { data } = await api.post(`/leaves/${id}/approve`, { remarks })
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
      toast.success('Leave request approved successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to approve leave request')
    },
  })
}

/**
 * Reject leave request
 */
export function useRejectLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, remarks }) => {
      const { data } = await api.post(`/leaves/${id}/reject`, { remarks })
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      toast.success('Leave request rejected')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to reject leave request')
    },
  })
}

/**
 * Cancel leave request
 */
export function useCancelLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.post(`/leaves/${id}/cancel`)
      return data
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['leave', id] })
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
      toast.success('Leave request cancelled')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to cancel leave request')
    },
  })
}

/**
 * Delete leave request
 */
export function useDeleteLeave() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/leaves/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] })
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] })
      toast.success('Leave request deleted successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to delete leave request')
    },
  })
}
