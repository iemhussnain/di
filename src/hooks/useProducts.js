/**
 * Custom hooks for product data fetching using React Query + Axios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/axios'
import toast from 'react-hot-toast'

/**
 * Fetch all products
 */
export function useProducts(filters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      )
      const { data } = await api.get(`/products?${params}`)
      return data
    },
  })
}

/**
 * Fetch single product by ID
 */
export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await api.get(`/products/${id}`)
      return data
    },
    enabled: !!id,
  })
}

/**
 * Create new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData) => {
      const { data } = await api.post('/products', productData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created successfully!')
    },
  })
}

/**
 * Update product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...productData }) => {
      const { data } = await api.put(`/products/${id}`, productData)
      return data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated successfully!')
    },
  })
}

/**
 * Delete product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { data} = await api.delete(`/products/${id}`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted successfully!')
    },
  })
}
