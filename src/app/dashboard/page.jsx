/**
 * Dashboard Page
 * Main ERP dashboard with KPIs and overview
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown } from 'lucide-react'

function StatCard({ title, value, change, icon: Icon, trend }) {
  const isPositive = trend === 'up'

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-gray-100">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span
                className={`text-sm ${
                  isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome to your ERP system overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value="Rs. 2,45,000"
          change="+12.5%"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Total Purchases"
          value="Rs. 1,80,000"
          change="+8.2%"
          icon={ShoppingCart}
          trend="up"
        />
        <StatCard
          title="Stock Value"
          value="Rs. 3,50,000"
          change="-3.1%"
          icon={Package}
          trend="down"
        />
        <StatCard
          title="Customers"
          value="156"
          change="+5.4%"
          icon={Users}
          trend="up"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Invoice #INV-2025-000{i}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer ABC Corp</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">Rs. 25,000</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Today</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Product A', qty: 5, reorder: 20 },
                { name: 'Product B', qty: 8, reorder: 15 },
                { name: 'Product C', qty: 3, reorder: 10 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Reorder Level: {item.reorder}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600 dark:text-red-400">{item.qty} units</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Low Stock</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <button className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-gray-100">New Sale</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create invoice</p>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-gray-100">New Purchase</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Record purchase</p>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-gray-100">Receive Payment</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Record payment</p>
            </button>
            <button className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="font-medium text-gray-900 dark:text-gray-100">Add Customer</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">New customer</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
