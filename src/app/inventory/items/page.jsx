/**
 * Items List Page
 * Display all items/products with search, filter, and actions
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Button,
  Input,
  Select,
  Table,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
} from '@/components/ui'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Pencil, Trash2, Plus, Search, Package, AlertTriangle } from 'lucide-react'
import { useInventoryItems, useDeleteInventoryItem } from '@/hooks/useInventoryItems'
import { useCategories } from '@/hooks/useCategories'

export default function ItemsPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category_id: '',
    is_active: 'true',
    low_stock: false,
  })

  // React Query hooks
  const { data: categoriesData } = useCategories(
    { is_active: 'true' },
    { page: 1, limit: 1000 }
  )

  const { data, isLoading, error, refetch } = useInventoryItems(
    {
      search: filters.search || undefined,
      category_id: filters.category_id || undefined,
      is_active: filters.is_active || undefined,
      low_stock: filters.low_stock ? 'true' : undefined,
    },
    { page: currentPage, limit: 50 }
  )

  const deleteItem = useDeleteInventoryItem()

  // Extract data
  const items = data?.data || []
  const categories = categoriesData?.data || []
  const pagination = data?.pagination || { page: 1, limit: 50, total: 0, pages: 0 }

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setCurrentPage(1) // Reset to first page
  }

  const handleSearch = (e) => {
    e.preventDefault()
    // React Query will auto-refetch when filters change
  }

  const handleDelete = async (itemId, itemName) => {
    if (!confirm(`Are you sure you want to delete item "${itemName}"?`)) {
      return
    }

    deleteItem.mutate(itemId)
  }

  const calculateTotalQty = (item) => {
    return (item.registered_qty || 0) + (item.unregistered_qty || 0)
  }

  const calculateTotalValue = (item) => {
    return (
      (item.registered_qty || 0) * (item.cost_registered || 0) +
      (item.unregistered_qty || 0) * (item.cost_unregistered || 0)
    )
  }

  const isLowStock = (item) => {
    const totalQty = calculateTotalQty(item)
    return totalQty <= (item.reorder_level || 0)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Items & Products</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your inventory items and products
            </p>
          </div>
          <div className="flex space-x-2">
            <Link href="/inventory/items/low-stock">
              <Button variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Low Stock
              </Button>
            </Link>
            <Link href="/inventory/items/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <p>Failed to load items: {error.message}</p>
            <Button className="mt-2" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <Input
                    name="search"
                    placeholder="Search by code, name, or description..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    autoComplete="off"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <Select
                    name="category_id"
                    value={filters.category_id}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Select name="is_active" value={filters.is_active} onChange={handleFilterChange}>
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="low_stock"
                    name="low_stock"
                    checked={filters.low_stock}
                    onChange={handleFilterChange}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="low_stock"
                    className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    Show low stock items only
                  </label>
                </div>
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Items ({pagination.total})
              {isLoading && <span className="text-sm font-normal ml-2">Loading...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No items found</p>
                <Link href="/inventory/items/new">
                  <Button className="mt-4">Create First Item</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr>
                        <th>Item Code</th>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>UOM</th>
                        <th className="text-right">Reg. Qty</th>
                        <th className="text-right">Unreg. Qty</th>
                        <th className="text-right">Total Qty</th>
                        <th className="text-right">Total Value</th>
                        <th className="text-right">Selling Price</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const totalQty = calculateTotalQty(item)
                        const totalValue = calculateTotalValue(item)
                        const lowStock = isLowStock(item)

                        return (
                          <tr
                            key={item._id}
                            className={lowStock ? 'bg-red-50 dark:bg-red-900/10' : ''}
                          >
                            <td className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                              {item.item_code}
                              {lowStock && (
                                <AlertTriangle className="h-4 w-4 inline ml-2 text-red-600 dark:text-red-400" />
                              )}
                            </td>
                            <td className="font-medium">{item.item_name}</td>
                            <td className="text-sm text-gray-600 dark:text-gray-400">
                              {item.category_id?.category_name || '-'}
                            </td>
                            <td className="text-sm">{item.unit_of_measure}</td>
                            <td className="text-right font-mono">
                              {(item.registered_qty || 0).toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-right font-mono">
                              {(item.unregistered_qty || 0).toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-right font-mono font-semibold">
                              {totalQty.toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-right font-mono">
                              {totalValue.toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="text-right font-mono">
                              {(item.selling_price || 0).toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td>
                              <div className="flex flex-col space-y-1">
                                {item.is_active ? (
                                  <span className="text-green-600 dark:text-green-400 text-sm">
                                    Active
                                  </span>
                                ) : (
                                  <span className="text-red-600 dark:text-red-400 text-sm">
                                    Inactive
                                  </span>
                                )}
                                {lowStock && (
                                  <span className="text-red-600 dark:text-red-400 text-xs">
                                    Low Stock
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => router.push(`/inventory/items/${item._id}/edit`)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item._id, item.item_name)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Showing page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))}
                        disabled={pagination.page === pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
