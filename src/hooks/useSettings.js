/**
 * Custom hooks for system settings using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all system settings
 */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
  })
}

/**
 * Fetch specific setting by key
 */
export function useSetting(key) {
  return useQuery({
    queryKey: ['setting', key],
    queryFn: async () => {
      const { data } = await api.get(`/settings/${key}`)
      return data
    },
    enabled: !!key,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Fetch company/organization settings
 */
export function useCompanySettings() {
  return useQuery({
    queryKey: ['settings', 'company'],
    queryFn: async () => {
      const { data } = await api.get('/settings/company')
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Fetch tax settings
 */
export function useTaxSettings() {
  return useQuery({
    queryKey: ['settings', 'tax'],
    queryFn: async () => {
      const { data } = await api.get('/settings/tax')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Fetch currency settings
 */
export function useCurrencySettings() {
  return useQuery({
    queryKey: ['settings', 'currency'],
    queryFn: async () => {
      const { data } = await api.get('/settings/currency')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Fetch email settings
 */
export function useEmailSettings() {
  return useQuery({
    queryKey: ['settings', 'email'],
    queryFn: async () => {
      const { data } = await api.get('/settings/email')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Fetch notification settings
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: async () => {
      const { data } = await api.get('/settings/notifications')
      return data
    },
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Fetch FBR integration settings
 */
export function useFBRSettings() {
  return useQuery({
    queryKey: ['settings', 'fbr'],
    queryFn: async () => {
      const { data } = await api.get('/settings/fbr')
      return data
    },
    staleTime: 30 * 60 * 1000,
  })
}

/**
 * Update settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settingsData) => {
      const { data } = await api.put('/settings', settingsData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update settings')
    },
  })
}

/**
 * Update company settings
 */
export function useUpdateCompanySettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (companyData) => {
      const { data } = await api.put('/settings/company', companyData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'company'] })
      toast.success('Company settings updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update company settings')
    },
  })
}

/**
 * Update tax settings
 */
export function useUpdateTaxSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taxData) => {
      const { data } = await api.put('/settings/tax', taxData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'tax'] })
      toast.success('Tax settings updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update tax settings')
    },
  })
}

/**
 * Update email settings
 */
export function useUpdateEmailSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (emailData) => {
      const { data } = await api.put('/settings/email', emailData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'email'] })
      toast.success('Email settings updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update email settings')
    },
  })
}

/**
 * Update notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationData) => {
      const { data } = await api.put('/settings/notifications', notificationData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] })
      toast.success('Notification settings updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update notification settings')
    },
  })
}

/**
 * Update FBR settings
 */
export function useUpdateFBRSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (fbrData) => {
      const { data } = await api.put('/settings/fbr', fbrData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'fbr'] })
      toast.success('FBR settings updated successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to update FBR settings')
    },
  })
}

/**
 * Test email configuration
 */
export function useTestEmailSettings() {
  return useMutation({
    mutationFn: async (testEmail) => {
      const { data } = await api.post('/settings/email/test', { test_email: testEmail })
      return data
    },
    onSuccess: () => {
      toast.success('Test email sent successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to send test email')
    },
  })
}

/**
 * Reset settings to default
 */
export function useResetSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category = 'all') => {
      const { data } = await api.post('/settings/reset', { category })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings reset to default values!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to reset settings')
    },
  })
}

/**
 * Upload company logo
 */
export function useUploadLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData) => {
      const { data } = await api.post('/settings/company/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'company'] })
      toast.success('Logo uploaded successfully!')
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to upload logo')
    },
  })
}

/**
 * Fetch system health/status
 */
export function useSystemStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const { data } = await api.get('/settings/system/status')
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  })
}
