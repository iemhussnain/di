'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Button, Input, Badge, Table, Skeleton } from '@/components/ui'
import { Plus, Search, Eye, DollarSign, XCircle } from 'lucide-react'

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchInvoices()
  }, [currentPage, searchTerm, statusFilter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      })
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/sales-invoices?${params}`)
      const data = await response.json()

      if (response.ok) {
        setInvoices(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async (id) => {
    if (!confirm('Post this invoice? This will create accounting entries.')) return

    try {
      const response = await fetch(`/api/sales-invoices/${id}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posted_by: '507f1f77bcf86cd799439011' }),
      })

      if (response.ok) {
        alert('Invoice posted successfully!')
        fetchInvoices()
      } else {
        const data = await response.json()
        alert(data.error)
      }
    } catch (error) {
      alert('Failed to post invoice')
    }
  }

  const getStatusBadge = (invoice) => {
    if (invoice.status === 'Fully Paid') {
      return <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>
    }
    if (invoice.status === 'Overdue') {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    }
    if (invoice.status === 'Partially Paid') {
      return <Badge className="bg-yellow-100 text-yellow-800">Partially Paid</Badge>
    }
    if (invoice.posted) {
      return <Badge className="bg-blue-100 text-blue-800">Posted</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
  }

  const formatCurrency = (amount) => {
    return `PKR ${amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Invoices</h1>
          <p className="text-gray-500 mt-1">Manage customer invoices and payments</p>
        </div>
        <Link href="/sales/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Posted">Posted</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Fully Paid">Fully Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <Table>
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Invoice No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{invoice.invoice_no}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(invoice.invoice_date)}</td>
                  <td className="px-6 py-4 text-sm">{invoice.customer_name}</td>
                  <td className="px-6 py-4">{getStatusBadge(invoice)}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    {formatCurrency(invoice.grand_total)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {formatCurrency(invoice.amount_due)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <Link href={`/sales/invoices/${invoice._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      {!invoice.posted && (
                        <Button variant="ghost" size="sm" onClick={() => handlePost(invoice._id)}>
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
