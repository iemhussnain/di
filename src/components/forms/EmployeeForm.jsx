'use client'

import { useState } from 'react'
import { Card, Input, Label, Textarea, Button, Alert } from '@/components/ui'
import { Plus, Trash2 } from 'lucide-react'

export default function EmployeeForm({ employee = null, onSubmit, isLoading = false }) {
  const [formData, setFormData] = useState({
    full_name: employee?.full_name || '',
    cnic: employee?.cnic || '',
    date_of_birth: employee?.date_of_birth
      ? new Date(employee.date_of_birth).toISOString().split('T')[0]
      : '',
    gender: employee?.gender || '',
    marital_status: employee?.marital_status || '',
    phone: employee?.phone || '',
    email: employee?.email || '',
    address: {
      street: employee?.address?.street || '',
      city: employee?.address?.city || '',
      province: employee?.address?.province || '',
      country: employee?.address?.country || 'Pakistan',
      postal_code: employee?.address?.postal_code || '',
    },
    department_id: employee?.department_id?._id || employee?.department_id || '',
    designation: employee?.designation || '',
    employment_type: employee?.employment_type || 'Permanent',
    joining_date: employee?.joining_date
      ? new Date(employee.joining_date).toISOString().split('T')[0]
      : '',
    basic_salary: employee?.basic_salary || 0,
    allowances: employee?.allowances || [],
    bank_account: employee?.bank_account || '',
    bank_name: employee?.bank_name || '',
    eobi_number: employee?.eobi_number || '',
    social_security_no: employee?.social_security_no || '',
    tax_exemption: employee?.tax_exemption || 0,
    status: employee?.status || 'Active',
    resignation_date: employee?.resignation_date
      ? new Date(employee.resignation_date).toISOString().split('T')[0]
      : '',
    notes: employee?.notes || '',
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleAddAllowance = () => {
    setFormData((prev) => ({
      ...prev,
      allowances: [...prev.allowances, { name: '', amount: 0, is_taxable: true }],
    }))
  }

  const handleRemoveAllowance = (index) => {
    setFormData((prev) => ({
      ...prev,
      allowances: prev.allowances.filter((_, i) => i !== index),
    }))
  }

  const handleAllowanceChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      allowances: prev.allowances.map((allowance, i) =>
        i === index ? { ...allowance, [field]: value } : allowance
      ),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // Basic client-side validation
    const newErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.cnic.trim()) {
      newErrors.cnic = 'CNIC is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (!formData.designation.trim()) {
      newErrors.designation = 'Designation is required'
    }

    if (!formData.joining_date) {
      newErrors.joining_date = 'Joining date is required'
    }

    if (!formData.basic_salary || formData.basic_salary <= 0) {
      newErrors.basic_salary = 'Basic salary must be greater than 0'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Submit form
    await onSubmit(formData)
  }

  const calculateGrossSalary = () => {
    const totalAllowances = formData.allowances.reduce(
      (sum, allowance) => sum + parseFloat(allowance.amount || 0),
      0
    )
    return parseFloat(formData.basic_salary || 0) + totalAllowances
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
              {errors.full_name && (
                <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cnic">
                CNIC <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cnic"
                name="cnic"
                value={formData.cnic}
                onChange={handleChange}
                placeholder="12345-1234567-1"
                maxLength={15}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: 12345-1234567-1</p>
              {errors.cnic && <p className="text-sm text-red-500 mt-1">{errors.cnic}</p>}
            </div>

            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="marital_status">Marital Status</Label>
              <select
                id="marital_status"
                name="marital_status"
                value={formData.marital_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Contact Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+92 300 1234567"
                required
              />
              {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="employee@example.com"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address.street">Street Address</Label>
              <Input
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                placeholder="Street address"
              />
            </div>

            <div>
              <Label htmlFor="address.city">City</Label>
              <Input
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>

            <div>
              <Label htmlFor="address.province">Province</Label>
              <Input
                id="address.province"
                name="address.province"
                value={formData.address.province}
                onChange={handleChange}
                placeholder="Province"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Employment Details */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Employment Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="designation">
                Designation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g., Software Engineer"
                required
              />
              {errors.designation && (
                <p className="text-sm text-red-500 mt-1">{errors.designation}</p>
              )}
            </div>

            <div>
              <Label htmlFor="employment_type">Employment Type</Label>
              <select
                id="employment_type"
                name="employment_type"
                value={formData.employment_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Intern">Intern</option>
              </select>
            </div>

            <div>
              <Label htmlFor="joining_date">
                Joining Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="joining_date"
                name="joining_date"
                type="date"
                value={formData.joining_date}
                onChange={handleChange}
                required
              />
              {errors.joining_date && (
                <p className="text-sm text-red-500 mt-1">{errors.joining_date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
              >
                <option value="Active">Active</option>
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>

            {(formData.status === 'Resigned' || formData.status === 'Terminated') && (
              <div>
                <Label htmlFor="resignation_date">Resignation/Termination Date</Label>
                <Input
                  id="resignation_date"
                  name="resignation_date"
                  type="date"
                  value={formData.resignation_date}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Salary Structure */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Salary Structure</h3>
            <div className="text-sm text-gray-500">
              Gross Salary: <span className="font-bold">PKR {calculateGrossSalary().toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="basic_salary">
                Basic Salary (PKR) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="basic_salary"
                name="basic_salary"
                type="number"
                step="0.01"
                value={formData.basic_salary}
                onChange={handleChange}
                placeholder="0.00"
                required
              />
              {errors.basic_salary && (
                <p className="text-sm text-red-500 mt-1">{errors.basic_salary}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Allowances</Label>
                <Button type="button" size="sm" onClick={handleAddAllowance} variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Allowance
                </Button>
              </div>

              <div className="space-y-2">
                {formData.allowances.map((allowance, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                  >
                    <div className="col-span-5">
                      <Input
                        placeholder="Allowance name"
                        value={allowance.name}
                        onChange={(e) => handleAllowanceChange(index, 'name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount"
                        value={allowance.amount}
                        onChange={(e) =>
                          handleAllowanceChange(index, 'amount', parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-2 flex items-center">
                      <label className="flex items-center space-x-1 text-xs">
                        <input
                          type="checkbox"
                          checked={allowance.is_taxable}
                          onChange={(e) =>
                            handleAllowanceChange(index, 'is_taxable', e.target.checked)
                          }
                          className="rounded"
                        />
                        <span>Taxable</span>
                      </label>
                    </div>
                    <div className="col-span-1 flex items-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveAllowance(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bank Details */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Bank Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="e.g., Allied Bank"
              />
            </div>

            <div>
              <Label htmlFor="bank_account">Account Number</Label>
              <Input
                id="bank_account"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleChange}
                placeholder="Enter account number"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tax & Social Security */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold">Tax & Social Security</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="eobi_number">EOBI Number</Label>
              <Input
                id="eobi_number"
                name="eobi_number"
                value={formData.eobi_number}
                onChange={handleChange}
                placeholder="EOBI number"
              />
            </div>

            <div>
              <Label htmlFor="social_security_no">Social Security No.</Label>
              <Input
                id="social_security_no"
                name="social_security_no"
                value={formData.social_security_no}
                onChange={handleChange}
                placeholder="Social security number"
              />
            </div>

            <div>
              <Label htmlFor="tax_exemption">Tax Exemption (PKR)</Label>
              <Input
                id="tax_exemption"
                name="tax_exemption"
                type="number"
                step="0.01"
                value={formData.tax_exemption}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>
          </div>
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
              placeholder="Any additional notes about this employee..."
              rows={4}
            />
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : employee ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  )
}
