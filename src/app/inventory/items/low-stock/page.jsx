/**
 * Low Stock Items Page
 * Display items with stock below reorder level
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Button,
  Table,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui'
import DashboardLayout from '@/components/layout/dashboard-layout'
import toast from 'react-hot-toast'
import { ChevronLeft, AlertTriangle, ShoppingCart } from 'lucide-react'

export default function LowStockItemsPage() {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLowStockItems()
  }, [])

  const fetchLowStockItems = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/items/low-stock')
      const data = await response.json()

      if (data.success) {
        setItems(data.data || [])
      } else {
        toast.error(data.error || 'Failed to fetch low stock items')
      }
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      toast.error('An error occurred while fetching low stock items')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotalQty = (item) => {
    return (item.registered_qty || 0) + (item.unregistered_qty || 0)
  }

  const getUrgencyColor = (item) => {
    const totalQty = calculateTotalQty(item)
    const reorderLevel = item.reorder_level || 0
    const urgency = totalQty - reorderLevel

    if (urgency < -reorderLevel * 0.5) {
      return 'text-red-600 dark:text-red-400 font-bold' // Critical
    } else if (urgency < 0) {
      return 'text-orange-600 dark:text-orange-400 font-semibold' // Warning
    } else {
      return 'text-yellow-600 dark:text-yellow-400' // Low
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/inventory/items"
            className="hover:text-gray-700 dark:hover:text-gray-300 flex items-center"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Items
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" />
              Low Stock Items
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Items with stock at or below reorder level
            </p>
          </div>
          <Button onClick={() => router.refresh()}>Refresh</Button>
        </div>

        {/* Low Stock Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {items.length} Item{items.length !== 1 ? 's' : ''} Require Attention
              {loading && <span className="text-sm font-normal ml-2">Loading...</span>}
            </CardTitle>
            <CardDescription>
              Items are sorted by urgency (most critical first)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {items.length === 0 && !loading ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                  No low stock items!
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  All items are above their reorder levels
                </p>
                <Link href="/inventory/items">
                  <Button className="mt-4" variant="outline">
                    View All Items
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <th>Item Code</th>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>UOM</th>
                      <th className="text-right">Current Stock</th>
                      <th className="text-right">Reorder Level</th>
                      <th className="text-right">Shortage</th>
                      <th className="text-right">Reorder Qty</th>
                      <th>Urgency</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const totalQty = calculateTotalQty(item)
                      const shortage = Math.max(0, (item.reorder_level || 0) - totalQty)
                      const urgencyClass = getUrgencyColor(item)

                      return (
                        <tr key={item._id} className="bg-red-50 dark:bg-red-900/10">
                          <td className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                            {item.item_code}
                          </td>
                          <td className="font-medium">{item.item_name}</td>
                          <td className="text-sm text-gray-600 dark:text-gray-400">
                            {item.category_id?.category_name || '-'}
                          </td>
                          <td className="text-sm">{item.unit_of_measure}</td>
                          <td className={`text-right font-mono ${urgencyClass}`}>
                            {totalQty.toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-right font-mono">
                            {(item.reorder_level || 0).toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-right font-mono text-red-600 dark:text-red-400 font-semibold">
                            {shortage.toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-right font-mono text-green-600 dark:text-green-400">
                            {(item.reorder_qty || 0).toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            <div className="flex items-center">
                              {shortage > (item.reorder_level || 0) * 0.5 ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400 mr-2"></span>
                                  <span className="text-sm text-red-600 dark:text-red-400 font-bold">
                                    Critical
                                  </span>
                                </>
                              ) : shortage > 0 ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-400 mr-2"></span>
                                  <span className="text-sm text-orange-600 dark:text-orange-400 font-semibold">
                                    Warning
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-yellow-600 dark:bg-yellow-400 mr-2"></span>
                                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                                    Low
                                  </span>
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/inventory/items/${item._id}/edit`)}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  // TODO: Create purchase order for this item
                                  toast.info('Purchase order feature coming soon')
                                }}
                              >
                                Order
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Critical Items</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {
                      items.filter((item) => {
                        const totalQty = calculateTotalQty(item)
                        const shortage = (item.reorder_level || 0) - totalQty
                        return shortage > (item.reorder_level || 0) * 0.5
                      }).length
                    }
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Warning Items</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {
                      items.filter((item) => {
                        const totalQty = calculateTotalQty(item)
                        const shortage = (item.reorder_level || 0) - totalQty
                        return (
                          shortage > 0 && shortage <= (item.reorder_level || 0) * 0.5
                        )
                      }).length
                    }
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {
                      items.filter((item) => {
                        const totalQty = calculateTotalQty(item)
                        return totalQty === (item.reorder_level || 0)
                      }).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
