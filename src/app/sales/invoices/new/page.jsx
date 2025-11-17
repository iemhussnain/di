'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SalesOrderForm from '@/components/forms/SalesOrderForm'

export default function NewSalesInvoicePage() {
  const router = useRouter()

  const handleSubmit = async (formData) => {
    // Calculate due date based on payment terms
    const invoiceDate = new Date(formData.order_date)
    let dueDate = new Date(invoiceDate)

    switch (formData.payment_terms) {
      case 'Net 7':
        dueDate.setDate(dueDate.getDate() + 7)
        break
      case 'Net 15':
        dueDate.setDate(dueDate.getDate() + 15)
        break
      case 'Net 30':
        dueDate.setDate(dueDate.getDate() + 30)
        break
      case 'Net 60':
        dueDate.setDate(dueDate.getDate() + 60)
        break
      case 'Net 90':
        dueDate.setDate(dueDate.getDate() + 90)
        break
      default:
        break
    }

    const invoiceData = {
      invoice_date: formData.order_date,
      due_date: dueDate.toISOString().split('T')[0],
      customer_id: formData.customer_id,
      payment_terms: formData.payment_terms,
      lines: formData.lines,
      notes: formData.notes,
      internal_notes: formData.internal_notes,
      created_by: formData.created_by,
    }

    const response = await fetch('/api/sales-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create invoice')
    }

    router.push(`/sales/invoices/${data.data._id}`)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/sales/invoices" className="p-2 hover:bg-gray-100 rounded-md">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Sales Invoice</h1>
          <p className="text-gray-500 mt-1">Create a new invoice for a customer</p>
        </div>
      </div>

      <SalesOrderForm onSubmit={handleSubmit} onCancel={() => router.push('/sales/invoices')} />
    </div>
  )
}
