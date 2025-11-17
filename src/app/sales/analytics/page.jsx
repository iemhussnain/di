'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Label } from '@/components/ui'
import { TrendingUp, DollarSign, Package, Users } from 'lucide-react'

export default function SalesAnalyticsPage() {
  const [salesSummary, setSalesSummary] = useState(null)
  const [revenueSummary, setRevenueSummary] = useState(null)
  const [topItems, setTopItems] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [agingReport, setAgingReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate })

      const [salesRes, revenueRes, itemsRes, customersRes, agingRes] = await Promise.all([
        fetch(`/api/sales-analytics?report_type=sales_summary&${params}`),
        fetch(`/api/sales-analytics?report_type=revenue_summary&${params}`),
        fetch(`/api/sales-analytics?report_type=top_items&${params}&limit=5`),
        fetch(`/api/sales-analytics?report_type=top_customers&${params}&limit=5`),
        fetch(`/api/sales-analytics?report_type=aging_report&${params}`),
      ])

      const [salesData, revenueData, itemsData, customersData, agingData] = await Promise.all([
        salesRes.json(),
        revenueRes.json(),
        itemsRes.json(),
        customersRes.json(),
        agingRes.json(),
      ])

      setSalesSummary(salesData.data)
      setRevenueSummary(revenueData.data)
      setTopItems(itemsData.data)
      setTopCustomers(customersData.data)
      setAgingReport(agingData.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) =>
    `PKR ${amount?.toLocaleString('en-PK', { minimumFractionDigits: 2 }) || '0.00'}`

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Analytics</h1>
        <p className="text-gray-500 mt-1">Track sales performance and trends</p>
      </div>

      <Card>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchAnalytics} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-2xl font-bold">{salesSummary?.total_orders || 0}</div>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Revenue</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(revenueSummary?.total_revenue)}
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Outstanding</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(revenueSummary?.total_outstanding)}
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Tax Collected</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(revenueSummary?.total_tax_collected)}
                </div>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Top Selling Items</h3>
            <div className="space-y-3">
              {topItems?.map((item, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b">
                  <div>
                    <div className="font-medium">{item.item_name}</div>
                    <div className="text-sm text-gray-500">Qty: {item.total_quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(item.total_amount)}</div>
                    <div className="text-sm text-gray-500">{item.order_count} orders</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Top Customers */}
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Top Customers</h3>
            <div className="space-y-3">
              {topCustomers?.map((customer, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b">
                  <div>
                    <div className="font-medium">{customer.customer_name}</div>
                    <div className="text-sm text-gray-500">{customer.customer_code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(customer.total_amount)}</div>
                    <div className="text-sm text-gray-500">{customer.total_orders} orders</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* AR Aging */}
      {agingReport && (
        <Card>
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Accounts Receivable Aging</h3>
            <div className="grid grid-cols-5 gap-4">
              <div className="p-4 bg-green-50 rounded">
                <div className="text-sm text-gray-600">Current</div>
                <div className="text-xl font-bold">{formatCurrency(agingReport.aging.current?.amount)}</div>
                <div className="text-sm text-gray-500">{agingReport.aging.current?.count} invoices</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded">
                <div className="text-sm text-gray-600">1-30 Days</div>
                <div className="text-xl font-bold">{formatCurrency(agingReport.aging['1-30']?.amount)}</div>
                <div className="text-sm text-gray-500">{agingReport.aging['1-30']?.count} invoices</div>
              </div>
              <div className="p-4 bg-orange-50 rounded">
                <div className="text-sm text-gray-600">31-60 Days</div>
                <div className="text-xl font-bold">{formatCurrency(agingReport.aging['31-60']?.amount)}</div>
                <div className="text-sm text-gray-500">{agingReport.aging['31-60']?.count} invoices</div>
              </div>
              <div className="p-4 bg-red-50 rounded">
                <div className="text-sm text-gray-600">61-90 Days</div>
                <div className="text-xl font-bold">{formatCurrency(agingReport.aging['61-90']?.amount)}</div>
                <div className="text-sm text-gray-500">{agingReport.aging['61-90']?.count} invoices</div>
              </div>
              <div className="p-4 bg-red-100 rounded">
                <div className="text-sm text-gray-600">Over 90 Days</div>
                <div className="text-xl font-bold">{formatCurrency(agingReport.aging['over-90']?.amount)}</div>
                <div className="text-sm text-gray-500">{agingReport.aging['over-90']?.count} invoices</div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
