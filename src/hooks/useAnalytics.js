/**
 * Custom hooks for analytics and reports using React Query + Axios
 */

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'

/**
 * Fetch sales analytics dashboard data
 */
export function useSalesAnalytics(period = 'month', startDate = null, endDate = null) {
  return useQuery({
    queryKey: ['sales-analytics', period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ period })
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      const { data } = await api.get(`/analytics/sales?${params}`)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch sales trends (chart data)
 */
export function useSalesTrends(period = 'daily', days = 30) {
  return useQuery({
    queryKey: ['sales-trends', period, days],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/sales/trends?period=${period}&days=${days}`)
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Fetch top selling products
 */
export function useTopProducts(limit = 10, period = 'month') {
  return useQuery({
    queryKey: ['top-products', limit, period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/products/top?limit=${limit}&period=${period}`)
      return data
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Fetch top customers
 */
export function useTopCustomers(limit = 10, period = 'month') {
  return useQuery({
    queryKey: ['top-customers', limit, period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/customers/top?limit=${limit}&period=${period}`)
      return data
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Fetch revenue analytics
 */
export function useRevenueAnalytics(startDate, endDate) {
  return useQuery({
    queryKey: ['revenue-analytics', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })
      const { data } = await api.get(`/analytics/revenue?${params}`)
      return data
    },
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Fetch purchase analytics
 */
export function usePurchaseAnalytics(period = 'month', startDate = null, endDate = null) {
  return useQuery({
    queryKey: ['purchase-analytics', period, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ period })
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      const { data } = await api.get(`/analytics/purchases?${params}`)
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Fetch inventory analytics
 */
export function useInventoryAnalytics() {
  return useQuery({
    queryKey: ['inventory-analytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/inventory')
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Fetch low stock alerts
 */
export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/inventory/low-stock')
      return data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stock levels change frequently
  })
}

/**
 * Fetch aging reports (receivables)
 */
export function useAgingReport(type = 'receivables', asOfDate = null) {
  return useQuery({
    queryKey: ['aging-report', type, asOfDate],
    queryFn: async () => {
      const params = asOfDate ? `?as_of_date=${asOfDate}` : ''
      const { data } = await api.get(`/analytics/aging/${type}${params}`)
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Fetch cash flow analytics
 */
export function useCashFlowAnalytics(startDate, endDate) {
  return useQuery({
    queryKey: ['cash-flow-analytics', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })
      const { data } = await api.get(`/analytics/cash-flow?${params}`)
      return data
    },
    enabled: !!startDate && !!endDate,
  })
}

/**
 * Fetch profit margin analytics
 */
export function useProfitMarginAnalytics(period = 'month') {
  return useQuery({
    queryKey: ['profit-margin-analytics', period],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/profit-margin?period=${period}`)
      return data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Fetch dashboard summary (overview stats)
 */
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/dashboard/summary')
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  })
}

/**
 * Fetch HR analytics
 */
export function useHRAnalytics(startDate = null, endDate = null) {
  return useQuery({
    queryKey: ['hr-analytics', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      const { data } = await api.get(`/analytics/hr?${params}`)
      return data
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  })
}

/**
 * Fetch sales by category
 */
export function useSalesByCategory(startDate, endDate) {
  return useQuery({
    queryKey: ['sales-by-category', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })
      const { data } = await api.get(`/analytics/sales/by-category?${params}`)
      return data
    },
    enabled: !!startDate && !!endDate,
  })
}

/**
 * Fetch sales by region/location
 */
export function useSalesByRegion(startDate, endDate) {
  return useQuery({
    queryKey: ['sales-by-region', startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      })
      const { data } = await api.get(`/analytics/sales/by-region?${params}`)
      return data
    },
    enabled: !!startDate && !!endDate,
  })
}

/**
 * Fetch customer lifetime value analytics
 */
export function useCustomerLifetimeValue(limit = 20) {
  return useQuery({
    queryKey: ['customer-lifetime-value', limit],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/customers/lifetime-value?limit=${limit}`)
      return data
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Fetch year-over-year comparison
 */
export function useYearOverYearComparison(metric = 'sales', year = new Date().getFullYear()) {
  return useQuery({
    queryKey: ['year-over-year', metric, year],
    queryFn: async () => {
      const { data } = await api.get(`/analytics/year-over-year?metric=${metric}&year=${year}`)
      return data
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}
