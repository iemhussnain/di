/**
 * New Payment Page
 * Create a new payment or receipt
 */

'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PaymentForm from '@/components/forms/PaymentForm'

export default function NewPaymentPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/sales/payments"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Payment</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Record a new customer receipt or vendor payment
          </p>
        </div>
      </div>

      {/* Form */}
      <PaymentForm mode="create" />
    </div>
  )
}
