/**
 * Account Form Component
 * Reusable form for creating and editing accounts
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, Select, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import toast from 'react-hot-toast'

export default function AccountForm({ account = null, isEdit = false }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [parentAccounts, setParentAccounts] = useState([])
  const [formData, setFormData] = useState({
    account_code: account?.account_code || '',
    account_name: account?.account_name || '',
    account_type: account?.account_type || 'Asset',
    parent_id: account?.parent_id?._id || '',
    is_header: account?.is_header || false,
    normal_balance: account?.normal_balance || 'Debit',
    opening_balance: account?.opening_balance || 0,
    description: account?.description || '',
  })

  // Fetch parent accounts based on selected account type
  useEffect(() => {
    if (formData.account_type) {
      fetchParentAccounts(formData.account_type)
    }
  }, [formData.account_type])

  const fetchParentAccounts = async (accountType) => {
    try {
      const response = await fetch(
        `/api/accounts/by-type/${accountType}?header_only=true&active_only=true`
      )
      const data = await response.json()

      if (data.success) {
        setParentAccounts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching parent accounts:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    // Auto-set normal balance based on account type
    if (name === 'account_type') {
      const normalBalanceMap = {
        Asset: 'Debit',
        Expense: 'Debit',
        Liability: 'Credit',
        Equity: 'Credit',
        Revenue: 'Credit',
      }
      setFormData((prev) => ({
        ...prev,
        normal_balance: normalBalanceMap[value],
        parent_id: '', // Reset parent when type changes
      }))
    }

    // Clear opening balance if is_header is checked
    if (name === 'is_header' && checked) {
      setFormData((prev) => ({
        ...prev,
        opening_balance: 0,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEdit ? `/api/accounts/${account._id}` : '/api/accounts'
      const method = isEdit ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parent_id: formData.parent_id || null,
          opening_balance: parseFloat(formData.opening_balance) || 0,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || `Account ${isEdit ? 'updated' : 'created'} successfully`)
        router.push('/accounting/accounts')
        router.refresh()
      } else {
        toast.error(data.error || `Failed to ${isEdit ? 'update' : 'create'} account`)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('An error occurred while submitting the form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit Account' : 'Create New Account'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Code & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_code" required>
                Account Code
              </Label>
              <Input
                id="account_code"
                name="account_code"
                value={formData.account_code}
                onChange={handleChange}
                placeholder="e.g., 1000"
                required
                maxLength={10}
                className="uppercase"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">Max 10 characters, letters, numbers, hyphens</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name" required>
                Account Name
              </Label>
              <Input
                id="account_name"
                name="account_name"
                value={formData.account_name}
                onChange={handleChange}
                placeholder="e.g., Cash in Hand"
                required
                maxLength={100}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Account Type & Normal Balance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_type" required>
                Account Type
              </Label>
              <Select
                id="account_type"
                name="account_type"
                value={formData.account_type}
                onChange={handleChange}
                required
              >
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Revenue">Revenue</option>
                <option value="Expense">Expense</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="normal_balance" required>
                Normal Balance
              </Label>
              <Select
                id="normal_balance"
                name="normal_balance"
                value={formData.normal_balance}
                onChange={handleChange}
                required
              >
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </Select>
              <p className="text-xs text-gray-500">Auto-set based on account type</p>
            </div>
          </div>

          {/* Parent Account */}
          <div className="space-y-2">
            <Label htmlFor="parent_id">Parent Account (Optional)</Label>
            <Select
              id="parent_id"
              name="parent_id"
              value={formData.parent_id}
              onChange={handleChange}
            >
              <option value="">-- No Parent (Root Account) --</option>
              {parentAccounts.map((parent) => (
                <option key={parent._id} value={parent._id}>
                  {parent.account_code} - {parent.account_name}
                </option>
              ))}
            </Select>
            <p className="text-xs text-gray-500">
              Only header accounts of type &quot;{formData.account_type}&quot; are shown
            </p>
          </div>

          {/* Is Header Account */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_header"
              name="is_header"
              checked={formData.is_header}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="is_header" className="mb-0">
              Header Account (Can have sub-accounts)
            </Label>
          </div>

          {/* Opening Balance */}
          <div className="space-y-2">
            <Label htmlFor="opening_balance">
              Opening Balance
              {formData.is_header && ' (Header accounts must have 0 balance)'}
            </Label>
            <Input
              id="opening_balance"
              name="opening_balance"
              type="number"
              step="0.01"
              value={formData.opening_balance}
              onChange={handleChange}
              disabled={formData.is_header}
              placeholder="0.00"
              autoComplete="off"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter account description..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
