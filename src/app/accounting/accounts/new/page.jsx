/**
 * New Account Page
 * Create a new account in the chart of accounts
 */

'use client'

import DashboardLayout from '@/components/layout/dashboard-layout'
import AccountForm from '@/components/forms/AccountForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewAccountPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">Create New Account</h1>
            <p className="text-sm text-gray-500 mt-1">
              Add a new account to your chart of accounts
            </p>
          </div>
        </div>

        {/* Form */}
        <AccountForm />
      </div>
    </DashboardLayout>
  )
}
