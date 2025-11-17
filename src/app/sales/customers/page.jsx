/**
 * Customers List Page
 * Display all customers with search, filter, and actions
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
  Badge,
  Alert,
} from '@/components/ui'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Pencil, Trash2, Plus, Search, Users, FileText, AlertCircle } from 'lucide-react'
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers'

const CUSTOMER_STATUS = ['Active', 'Inactive', 'Blocked']

export default function CustomersPage() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'Active',
    is_registered: '',
    outstanding: false,
    credit_exceeded: false,
  })

  // React Query hooks
  const { data, isLoading, error, refetch } = useCustomers(
    {
      search: filters.search,
      status: filters.status,
      is_registered: filters.is_registered,
      outstanding: filters.outstanding ? 'true' : undefined,
      credit_exceeded: filters.credit_exceeded ? 'true' : undefined,
    },
    { page: currentPage, limit: 50 }
  )

  const deleteCustomer = useDeleteCustomer()

  // Extract data
  const customers = data?.data || []
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

  const handleDelete = async (customerId, customerName) => {
    if (!confirm(`Are you sure you want to delete customer "${customerName}"?`)) {
      return
    }

    deleteCustomer.mutate(customerId)
  }

  const getStatusBadge = (status) => {
    const variants = {
      Active: 'default',
      Inactive: 'secondary',
      Blocked: 'destructive',
    }
    return variants[status] || 'secondary'
  }

  const calculateOutstanding = (currentBalance) => {
    return -currentBalance // Negative balance means customer owes us
  }

  const isCreditExceeded = (customer) => {
    const outstanding = calculateOutstanding(customer.current_balance)
    return outstanding > customer.credit_limit
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your customer database</p>
          </div>
          <Link href="/sales/customers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <p>Failed to load customers: {error.message}</p>
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
                    placeholder="Search by name, code, phone, email..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    autoComplete="off"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <Select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">All Status</option>
                    {CUSTOMER_STATUS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Registration Filter */}
                <div>
                  <Select name="is_registered" value={filters.is_registered} onChange={handleFilterChange}>
                    <option value="">All Types</option>
                    <option value="true">Registered Only</option>
                    <option value="false">Unregistered Only</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="outstanding"
                      name="outstanding"
                      checked={filters.outstanding}
                      onChange={handleFilterChange}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="outstanding" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                      Outstanding Balance
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="credit_exceeded"
                      name="credit_exceeded"
                      checked={filters.credit_exceeded}
                      onChange={handleFilterChange}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="credit_exceeded"
                      className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      Credit Limit Exceeded
                    </label>
                  </div>
                </div>
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Customers ({pagination.total})
              {isLoading && <span className="text-sm font-normal ml-2">Loading...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {customers.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No customers found</p>
                <Link href="/sales/customers/new">
                  <Button className="mt-4">Create First Customer</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>City</th>
                        <th>Type</th>
                        <th className="text-right">Credit Limit</th>
                        <th className="text-right">Outstanding</th>
                        <th>Payment Terms</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => {
                        const outstanding = calculateOutstanding(customer.current_balance)
                        const creditExceeded = isCreditExceeded(customer)

                        return (
                          <tr
                            key={customer._id}
                            className={creditExceeded ? 'bg-red-50 dark:bg-red-900/10' : ''}
                          >
                            <td className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                              {customer.customer_code}
                            </td>
                            <td className="font-medium">
                              <Link
                                href={`/sales/customers/${customer._id}`}
                                className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                              >
                                {customer.customer_name}
                              </Link>
                            </td>
                            <td className="text-sm">{customer.phone}</td>
                            <td className="text-sm text-gray-600 dark:text-gray-400">
                              {customer.address?.city || '-'}
                            </td>
                            <td>
                              {customer.is_registered ? (
                                <Badge variant="default" className="text-xs">
                                  Registered
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Unregistered
                                </Badge>
                              )}
                            </td>
                            <td className="text-right font-mono">
                              {customer.credit_limit.toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td
                              className={`text-right font-mono ${
                                outstanding > 0
                                  ? 'text-red-600 dark:text-red-400 font-semibold'
                                  : 'text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {outstanding.toLocaleString('en-PK', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              {creditExceeded && <AlertCircle className="h-4 w-4 inline ml-2" />}
                            </td>
                            <td className="text-sm">{customer.payment_terms}</td>
                            <td>
                              <Badge variant={getStatusBadge(customer.status)} className="text-xs">
                                {customer.status}
                              </Badge>
                            </td>
                            <td>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => router.push(`/sales/customers/${customer._id}`)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="View Details"
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => router.push(`/sales/customers/${customer._id}/edit`)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(customer._id, customer.customer_name)}
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
