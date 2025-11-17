'use client'

import { useState, useEffect } from 'react'
import { Card, Input, Label, Textarea, Button, Alert, Badge } from '@/components/ui'
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function JournalEntryForm({ entry = null, onSubmit, isLoading = false, userId }) {
  const [accounts, setAccounts] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const [formData, setFormData] = useState({
    entry_date: entry?.entry_date
      ? new Date(entry.entry_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    entry_type: entry?.entry_type || 'Manual',
    description: entry?.description || '',
    lines: entry?.lines || [
      { account_id: '', debit: 0, credit: 0, description: '' },
      { account_id: '', debit: 0, credit: 0, description: '' },
    ],
    notes: entry?.notes || '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true)
      const response = await fetch('/api/accounts?limit=1000&is_active=true&is_header=false')
      const data = await response.json()

      if (response.ok) {
        setAccounts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleLineChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) =>
        i === index ? { ...line, [field]: value } : line
      ),
    }))
  }

  const handleAddLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { account_id: '', debit: 0, credit: 0, description: '' }],
    }))
  }

  const handleRemoveLine = (index) => {
    if (formData.lines.length <= 2) {
      alert('Journal entry must have at least 2 lines')
      return
    }

    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }))
  }

  const calculateTotals = () => {
    const totalDebit = formData.lines.reduce((sum, line) => sum + parseFloat(line.debit || 0), 0)
    const totalCredit = formData.lines.reduce((sum, line) => sum + parseFloat(line.credit || 0), 0)

    return {
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      difference: Math.round((totalDebit - totalCredit) * 100) / 100,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // Client-side validation
    const newErrors = {}

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.entry_date) {
      newErrors.entry_date = 'Entry date is required'
    }

    // Validate lines
    formData.lines.forEach((line, index) => {
      if (!line.account_id) {
        newErrors[`line_${index}_account`] = 'Account is required'
      }

      const debit = parseFloat(line.debit || 0)
      const credit = parseFloat(line.credit || 0)

      if (debit === 0 && credit === 0) {
        newErrors[`line_${index}_amount`] = 'Line must have either debit or credit amount'
      }

      if (debit > 0 && credit > 0) {
        newErrors[`line_${index}_amount`] = 'Line cannot have both debit and credit'
      }
    })

    // Check balance
    const totals = calculateTotals()
    if (!totals.isBalanced) {
      newErrors.balance = `Entry is not balanced. Difference: ${totals.difference}`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Prepare data for submission
    const submitData = {
      ...formData,
      created_by: userId,
      lines: formData.lines.map((line) => ({
        account_id: line.account_id,
        debit: parseFloat(line.debit || 0),
        credit: parseFloat(line.credit || 0),
        description: line.description || '',
      })),
    }

    await onSubmit(submitData)
  }

  const totals = calculateTotals()

  const getAccountName = (accountId) => {
    const account = accounts.find((acc) => acc._id === accountId)
    return account ? `${account.account_code} - ${account.account_name}` : ''
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Entry Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entry_date">
                Entry Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="entry_date"
                name="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={handleChange}
                required
              />
              {errors.entry_date && (
                <p className="text-sm text-red-500 mt-1">{errors.entry_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="entry_type">Entry Type</Label>
              <select
                id="entry_type"
                name="entry_type"
                value={formData.entry_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="Manual">Manual</option>
                <option value="Sales">Sales</option>
                <option value="Purchase">Purchase</option>
                <option value="Payment">Payment</option>
                <option value="Receipt">Receipt</option>
                <option value="Adjustment">Adjustment</option>
                <option value="Payroll">Payroll</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="flex-1">
                <Label>Balance Status</Label>
                <div className="mt-2">
                  {totals.isBalanced ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Balanced
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Out of Balance
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter journal entry description..."
              rows={2}
              required
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Journal Lines */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Journal Lines</h3>
            <Button type="button" size="sm" onClick={handleAddLine} variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Add Line
            </Button>
          </div>

          <div className="space-y-3">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase px-2">
              <div className="col-span-5">Account</div>
              <div className="col-span-2 text-right">Debit</div>
              <div className="col-span-2 text-right">Credit</div>
              <div className="col-span-2">Description</div>
              <div className="col-span-1"></div>
            </div>

            {/* Lines */}
            {formData.lines.map((line, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800"
              >
                <div className="col-span-5">
                  <select
                    value={line.account_id}
                    onChange={(e) => handleLineChange(index, 'account_id', e.target.value)}
                    className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                    disabled={loadingAccounts}
                  >
                    <option value="">Select Account...</option>
                    {accounts.map((account) => (
                      <option key={account._id} value={account._id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </select>
                  {errors[`line_${index}_account`] && (
                    <p className="text-xs text-red-500 mt-1">{errors[`line_${index}_account`]}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.debit}
                    onChange={(e) => handleLineChange(index, 'debit', e.target.value)}
                    placeholder="0.00"
                    className="text-right"
                  />
                </div>

                <div className="col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.credit}
                    onChange={(e) => handleLineChange(index, 'credit', e.target.value)}
                    placeholder="0.00"
                    className="text-right"
                  />
                  {errors[`line_${index}_amount`] && (
                    <p className="text-xs text-red-500 mt-1">{errors[`line_${index}_amount`]}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Input
                    type="text"
                    value={line.description}
                    onChange={(e) => handleLineChange(index, 'description', e.target.value)}
                    placeholder="Line description"
                    className="text-sm"
                  />
                </div>

                <div className="col-span-1 flex items-start justify-center">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveLine(index)}
                    disabled={formData.lines.length <= 2}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Row */}
          <div className="border-t-2 border-gray-300 dark:border-gray-600 pt-3">
            <div className="grid grid-cols-12 gap-2 px-2">
              <div className="col-span-5 flex items-center">
                <span className="font-bold">Totals:</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="font-bold text-lg">PKR {formatCurrency(totals.totalDebit)}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="font-bold text-lg">PKR {formatCurrency(totals.totalCredit)}</span>
              </div>
              <div className="col-span-3 flex items-center justify-end">
                {!totals.isBalanced && (
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Difference: PKR {formatCurrency(Math.abs(totals.difference))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {errors.balance && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{errors.balance}</p>
            </Alert>
          )}
        </div>
      </Card>

      {/* Notes */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Additional Notes</h3>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any additional notes about this journal entry..."
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !totals.isBalanced}>
          {isLoading ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  )
}
