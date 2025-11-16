'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Badge, Alert, Skeleton, Tabs } from '@/components/ui'
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Calendar, Briefcase, DollarSign } from 'lucide-react'

export default function EmployeeDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (params.id) {
      fetchEmployee()
    }
  }, [params.id])

  const fetchEmployee = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/employees/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employee')
      }

      setEmployee(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to terminate this employee?')) {
      return
    }

    try {
      const response = await fetch(`/api/employees/${params.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete employee')
      }

      router.push('/hr/employees')
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const calculateGrossSalary = () => {
    if (!employee) return 0
    const totalAllowances = employee.allowances?.reduce(
      (sum, allowance) => sum + allowance.amount,
      0
    ) || 0
    return employee.basic_salary + totalAllowances
  }

  const getStatusBadge = (status) => {
    const variants = {
      Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Resigned: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      Terminated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    }

    return <Badge className={variants[status] || variants.Active}>{status}</Badge>
  }

  const getEmploymentTypeBadge = (type) => {
    const variants = {
      Permanent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Contract: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      Intern: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    }

    return <Badge className={variants[type] || variants.Permanent}>{type}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Alert variant="destructive">
          <p>{error || 'Employee not found'}</p>
        </Alert>
      </div>
    )
  }

  const grossSalary = calculateGrossSalary()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/hr/employees"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{employee.full_name}</h1>
              {getStatusBadge(employee.status)}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {employee.employee_code} • {employee.designation}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/hr/employees/${employee._id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Basic Salary</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(employee.basic_salary)}</div>
            <div className="text-xs text-gray-500 mt-1">Per month</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Gross Salary</div>
            <div className="text-2xl font-bold mt-2">{formatCurrency(grossSalary)}</div>
            <div className="text-xs text-gray-500 mt-1">
              Including {employee.allowances?.length || 0} allowances
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Employment Type</div>
            <div className="mt-2">{getEmploymentTypeBadge(employee.employment_type)}</div>
            <div className="text-xs text-gray-500 mt-1">
              Joined {formatDate(employee.joining_date)}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">Service Duration</div>
            <div className="text-2xl font-bold mt-2">
              {employee.service_years !== undefined ? `${employee.service_years} yrs` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {employee.age !== undefined && employee.age !== null
                ? `Age: ${employee.age} years`
                : 'Age: N/A'}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'salary'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Salary & Allowances
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'attendance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Attendance
            </button>
            <button
              onClick={() => setActiveTab('payslips')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payslips'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Payslips
            </button>
          </div>
        </div>

        <div className="mt-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">CNIC</div>
                      <div className="font-medium">{employee.cnic}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Date of Birth</div>
                      <div className="font-medium">{formatDate(employee.date_of_birth)}</div>
                    </div>
                    {employee.gender && (
                      <div>
                        <div className="text-sm text-gray-500">Gender</div>
                        <div className="font-medium">{employee.gender}</div>
                      </div>
                    )}
                    {employee.marital_status && (
                      <div>
                        <div className="text-sm text-gray-500">Marital Status</div>
                        <div className="font-medium">{employee.marital_status}</div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Contact Information */}
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-medium">{employee.phone}</div>
                      </div>
                    </div>
                    {employee.email && (
                      <div className="flex items-start space-x-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div className="font-medium">{employee.email}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Address */}
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Address</h3>
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      {employee.address?.street && <div>{employee.address.street}</div>}
                      <div>
                        {[
                          employee.address?.city,
                          employee.address?.province,
                          employee.address?.postal_code,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                      {employee.address?.country && <div>{employee.address.country}</div>}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Bank Details */}
              {(employee.bank_name || employee.bank_account) && (
                <Card>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Bank Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employee.bank_name && (
                        <div>
                          <div className="text-sm text-gray-500">Bank Name</div>
                          <div className="font-medium">{employee.bank_name}</div>
                        </div>
                      )}
                      {employee.bank_account && (
                        <div>
                          <div className="text-sm text-gray-500">Account Number</div>
                          <div className="font-medium">{employee.bank_account}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Tax & Social Security */}
              {(employee.eobi_number ||
                employee.social_security_no ||
                employee.tax_exemption > 0) && (
                <Card>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Tax & Social Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {employee.eobi_number && (
                        <div>
                          <div className="text-sm text-gray-500">EOBI Number</div>
                          <div className="font-medium">{employee.eobi_number}</div>
                        </div>
                      )}
                      {employee.social_security_no && (
                        <div>
                          <div className="text-sm text-gray-500">Social Security No.</div>
                          <div className="font-medium">{employee.social_security_no}</div>
                        </div>
                      )}
                      {employee.tax_exemption > 0 && (
                        <div>
                          <div className="text-sm text-gray-500">Tax Exemption</div>
                          <div className="font-medium">{formatCurrency(employee.tax_exemption)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Notes */}
              {employee.notes && (
                <Card>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Notes</h3>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {employee.notes}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Salary Tab */}
          {activeTab === 'salary' && (
            <div className="space-y-6">
              <Card>
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Salary Structure</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium">Basic Salary</span>
                      <span className="font-bold">{formatCurrency(employee.basic_salary)}</span>
                    </div>

                    {employee.allowances && employee.allowances.length > 0 && (
                      <>
                        <div className="text-sm font-medium text-gray-500 mt-4">Allowances</div>
                        {employee.allowances.map((allowance, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-2 pl-4 border-l-2 border-blue-500"
                          >
                            <div>
                              <span>{allowance.name}</span>
                              {allowance.is_taxable && (
                                <Badge className="ml-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Taxable
                                </Badge>
                              )}
                            </div>
                            <span>{formatCurrency(allowance.amount)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    <div className="flex justify-between items-center py-3 mt-4 border-t-2 border-gray-300 dark:border-gray-600">
                      <span className="text-lg font-bold">Gross Salary</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(grossSalary)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <Card>
              <div className="p-6">
                <p className="text-gray-500 text-center py-12">
                  Attendance records will be displayed here once attendance tracking is implemented.
                </p>
              </div>
            </Card>
          )}

          {/* Payslips Tab */}
          {activeTab === 'payslips' && (
            <Card>
              <div className="p-6">
                <p className="text-gray-500 text-center py-12">
                  Payslips will be displayed here once payroll is implemented.
                </p>
              </div>
            </Card>
          )}
        </div>
      </Tabs>
    </div>
  )
}
