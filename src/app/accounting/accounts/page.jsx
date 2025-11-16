/**
 * Chart of Accounts List Page
 * Display all accounts with search, filter, and actions
 */

'use client'

import { useState, useEffect } from 'react'
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
} from '@/components/ui'
import DashboardLayout from '@/components/layout/dashboard-layout'
import toast from 'react-hot-toast'
import { Pencil, Trash2, Plus, Search, FileText } from 'lucide-react'

export default function AccountsPage() {
  const router = useRouter()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    account_type: '',
    is_header: '',
    is_active: 'true',
  })

  useEffect(() => {
    fetchAccounts()
  }, [pagination.page, filters])

  const fetchAccounts = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.account_type && { account_type: filters.account_type }),
        ...(filters.is_header && { is_header: filters.is_header }),
        ...(filters.is_active && { is_active: filters.is_active }),
      })

      const response = await fetch(`/api/accounts?${queryParams}`)
      const data = await response.json()

      if (data.success) {
        setAccounts(data.data || [])
        setPagination(data.pagination)
      } else {
        toast.error(data.error || 'Failed to fetch accounts')
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('An error occurred while fetching accounts')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to first page
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchAccounts()
  }

  const handleDelete = async (accountId, accountName) => {
    if (!confirm(`Are you sure you want to delete account "${accountName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Account deleted successfully')
        fetchAccounts()
      } else {
        toast.error(data.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('An error occurred while deleting account')
    }
  }

  const getAccountTypeColor = (type) => {
    const colors = {
      Asset: 'bg-green-100 text-green-800',
      Liability: 'bg-red-100 text-red-800',
      Equity: 'bg-blue-100 text-blue-800',
      Revenue: 'bg-purple-100 text-purple-800',
      Expense: 'bg-orange-100 text-orange-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your accounting chart of accounts</p>
          </div>
          <Link href="/accounting/accounts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <Input
                    name="search"
                    placeholder="Search by code or name..."
                    value={filters.search}
                    onChange={handleFilterChange}
                    autoComplete="off"
                  />
                </div>

                {/* Account Type */}
                <div>
                  <Select
                    name="account_type"
                    value={filters.account_type}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Types</option>
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                  </Select>
                </div>

                {/* Header Filter */}
                <div>
                  <Select name="is_header" value={filters.is_header} onChange={handleFilterChange}>
                    <option value="">All Accounts</option>
                    <option value="true">Header Only</option>
                    <option value="false">Detail Only</option>
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
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Link href="/accounting/accounts/tree">
                  <Button type="button" variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Tree
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Accounts ({pagination.total})
              {loading && <span className="text-sm font-normal ml-2">Loading...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 && !loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No accounts found</p>
                <Link href="/accounting/accounts/new">
                  <Button className="mt-4">Create First Account</Button>
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
                        <th>Type</th>
                        <th>Parent</th>
                        <th>Balance</th>
                        <th>Header</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accounts.map((account) => (
                        <tr key={account._id}>
                          <td className="font-mono font-semibold">{account.account_code}</td>
                          <td>{account.account_name}</td>
                          <td>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(
                                account.account_type
                              )}`}
                            >
                              {account.account_type}
                            </span>
                          </td>
                          <td className="text-sm text-gray-600">
                            {account.parent_id
                              ? `${account.parent_id.account_code} - ${account.parent_id.account_name}`
                              : '-'}
                          </td>
                          <td className="font-mono text-right">
                            {account.current_balance.toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            {account.is_header ? (
                              <span className="text-blue-600 font-medium">Yes</span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </td>
                          <td>
                            {account.is_active ? (
                              <span className="text-green-600">Active</span>
                            ) : (
                              <span className="text-red-600">Inactive</span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  router.push(`/accounting/accounts/${account._id}/edit`)
                                }
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(account._id, account.account_name)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <p className="text-sm text-gray-600">
                      Showing page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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
