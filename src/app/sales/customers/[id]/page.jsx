/**
 * Customer Details Page
 * View customer information, ledger, and invoices
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Separator,
} from '@/components/ui'
import DashboardLayout from '@/components/layout/dashboard-layout'
import toast from 'react-hot-toast'
import { ChevronLeft, Pencil, FileText, Receipt, AlertCircle, Phone, Mail, MapPin } from 'lucide-react'

export default function CustomerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState(null)
  const [ledger, setLedger] = useState(null)
  const [invoices, setInvoices] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchCustomer()
      fetchLedger()
      fetchInvoices()
    }
  }, [params.id])

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setCustomer(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch customer')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
      toast.error('An error occurred while fetching customer')
    } finally {
      setLoading(false)
    }
  }

  const fetchLedger = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}/ledger`)
      const data = await response.json()

      if (data.success) {
        setLedger(data.data)
      }
    } catch (error) {
      console.error('Error fetching ledger:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`/api/customers/${params.id}/invoices`)
      const data = await response.json()

      if (data.success) {
        setInvoices(data.data)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      Active: 'default',
      Inactive: 'secondary',
      Blocked: 'destructive',
    }
    return variants[status] || 'secondary'
  }

  const calculateOutstanding = () => {
    if (!customer) return 0
    return -customer.current_balance
  }

  const isCreditExceeded = () => {
    if (!customer) return false
    const outstanding = calculateOutstanding()
    return outstanding > customer.credit_limit
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-500 dark:text-gray-400">Loading customer...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Customer not found</p>
          <Link href="/sales/customers" className="text-blue-600 dark:text-blue-400 hover:underline">
            Return to Customers
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const outstanding = calculateOutstanding()
  const creditExceeded = isCreditExceeded()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/sales/customers"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customer.customer_name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{customer.customer_code}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => router.push(`/sales/customers/${customer._id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Customer Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusBadge(customer.status)}>{customer.status}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Credit Limit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {customer.credit_limit.toLocaleString('en-PK', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </CardContent>
          </Card>

          <Card className={creditExceeded ? 'border-red-500 dark:border-red-400' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Outstanding Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  outstanding > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}
              >
                {outstanding.toLocaleString('en-PK', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {creditExceeded && (
                <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-2">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Credit limit exceeded
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{customer.payment_terms}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Registration Status */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Registration Status</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant={customer.is_registered ? 'default' : 'secondary'}>
                      {customer.is_registered ? 'Registered' : 'Unregistered'}
                    </Badge>
                  </div>
                  {customer.is_registered && (
                    <div className="mt-3 space-y-2 text-sm">
                      {customer.ntn && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">NTN:</span> {customer.ntn}
                        </p>
                      )}
                      {customer.strn && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">STRN:</span> {customer.strn}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 mr-2" />
                      {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4 mr-2" />
                        {customer.email}
                      </div>
                    )}
                    {customer.cnic && (
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">CNIC:</span> {customer.cnic}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Address */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Address</h4>
                  {customer.address?.street || customer.address?.city ? (
                    <div className="flex items-start text-gray-600 dark:text-gray-400 text-sm">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        {customer.address.street && <p>{customer.address.street}</p>}
                        {customer.address.city && (
                          <p>
                            {customer.address.city}
                            {customer.address.province && `, ${customer.address.province}`}
                          </p>
                        )}
                        {customer.address.postal_code && <p>{customer.address.postal_code}</p>}
                        {customer.address.country && <p>{customer.address.country}</p>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500">No address provided</p>
                  )}
                </div>

                {customer.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Notes</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {customer.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ledger Tab */}
          <TabsContent value="ledger">
            <Card>
              <CardHeader>
                <CardTitle>Customer Ledger</CardTitle>
                <CardDescription>Transaction history for this customer</CardDescription>
              </CardHeader>
              <CardContent>
                {ledger && ledger.transactions && ledger.transactions.length > 0 ? (
                  <div className="space-y-4">
                    {/* Ledger table will go here */}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ledger entries will appear here once transactions are recorded.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No ledger entries yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Ledger functionality will be available after journal entries module is implemented
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Customer Invoices</CardTitle>
                <CardDescription>Sales invoices for this customer</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices && invoices.invoices && invoices.invoices.length > 0 ? (
                  <div className="space-y-4">
                    {/* Invoices table will go here */}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Invoice history will appear here once sales are recorded.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No invoices yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      Invoice functionality will be available after sales module is implemented
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
