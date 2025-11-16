'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, Alert, Skeleton, Tabs } from '@/components/ui'
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react'

export default function VendorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (params.id) {
      fetchVendor()
    }
  }, [params.id])

  const fetchVendor = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/vendors/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vendor')
      }

      setVendor(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to deactivate this vendor?')) {
      return
    }

    try {
      const response = await fetch(`/api/vendors/${params.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete vendor')
      }

      router.push('/purchases/vendors')
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusBadge = (status) => {
    const variants = {
      Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      Blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }

    return <Badge className={variants[status] || variants.Active}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Alert variant="destructive">
          <p>{error || 'Vendor not found'}</p>
        </Alert>
      </div>
    )
  }

  const payableAmount = vendor.current_balance

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/purchases/vendors"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{vendor.vendor_name}</h1>
              {getStatusBadge(vendor.status)}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{vendor.vendor_code}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/purchases/vendors/${vendor._id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Payable Amount</div>
            <div
              className={`text-2xl font-bold mt-2 ${
                payableAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}
            >
              {formatCurrency(payableAmount)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {payableAmount > 0 ? 'We owe vendor' : 'Vendor owes us'}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Payment Terms</div>
            <div className="text-2xl font-bold mt-2">{vendor.payment_terms}</div>
            <div className="text-xs text-gray-500 mt-1">
              {vendor.is_registered ? 'Registered Vendor' : 'Unregistered Vendor'}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Opening Balance</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(vendor.opening_balance)}</div>
            <div className="text-xs text-gray-500 mt-1">Initial balance</div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ledger'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invoices'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Purchase Invoices
            </button>
          </div>
        </div>

        <div className="mt-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium">{vendor.phone}</div>
                      </div>
                    </div>
                    {vendor.email && (
                      <div className="flex items-start space-x-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div className="font-medium">{vendor.email}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Address */}
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      {vendor.address?.street && <div>{vendor.address.street}</div>}
                      <div>
                        {[
                          vendor.address?.city,
                          vendor.address?.province,
                          vendor.address?.postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                      {vendor.address?.country && <div>{vendor.address.country}</div>}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tax Registration */}
              {vendor.is_registered && (
                <Card>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Tax Registration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vendor.ntn && (
                        <div>
                          <div className="text-sm text-gray-500">NTN</div>
                          <div className="font-medium">{vendor.ntn}</div>
                        </div>
                      )}
                      {vendor.strn && (
                        <div>
                          <div className="text-sm text-gray-500">STRN</div>
                          <div className="font-medium">{vendor.strn}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Notes */}
              {vendor.notes && (
                <Card>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Notes</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {vendor.notes}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Ledger Tab */}
          {activeTab === 'ledger' && (
            <Card>
              <div className="p-6">
                <p className="text-gray-500 text-center py-12">
                  Vendor ledger will be displayed here once transactions are implemented.
                </p>
              </div>
            </Card>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <Card>
              <div className="p-6">
                <p className="text-gray-500 text-center py-12">
                  Purchase invoices will be displayed here once invoicing is implemented.
                </p>
              </div>
            </Card>
          )}
        </div>
      </Tabs>
    </div>
  )
}
