/**
 * Edit Account Page
 * Edit an existing account in the chart of accounts
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import DashboardLayout from '@/components/layout/dashboard-layout'
import AccountForm from '@/components/forms/AccountForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditAccountPage() {
  const params = useParams()
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccount()
  }, [params.id])

  const fetchAccount = async () => {
    try {
      const response = await fetch(`/api/accounts/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setAccount(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch account')
      }
    } catch (error) {
      console.error('Error fetching account:', error)
      toast.error('An error occurred while fetching account')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading account...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!account) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 text-lg">Account not found</p>
            <Link href="/accounting/accounts" className="text-blue-600 hover:underline mt-2 block">
              Back to Accounts
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link
            href="/accounting/accounts"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Account</h1>
            <p className="text-sm text-gray-500 mt-1">
              {account.account_code} - {account.account_name}
            </p>
          </div>
        </div>

        {/* Form */}
        <AccountForm account={account} isEdit={true} />
      </div>
    </DashboardLayout>
  )
}
