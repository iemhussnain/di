/**
 * Settings Page
 * User profile and FBR tax information settings
 */

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Save, Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showTokens, setShowTokens] = useState({
    sandbox: false,
    production: false
  })

  const [formData, setFormData] = useState({
    // Profile
    name: '',
    email: '',
    employee_id: '',

    // FBR Tax Information
    company_ntn: '',
    company_strn: '',
    company_ref_no: '',
    company_province: '',
    company_address: '',
    fbr_sandbox_token: '',
    fbr_production_token: '',
    fbr_registration_status: 'Not Registered'
  })

  useEffect(() => {
    fetchUserSettings()
  }, [])

  const fetchUserSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          ...data.user
        }))
      }
    } catch (error) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const formatNTN = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '')
    // Limit to 7 digits
    return digits.slice(0, 7)
  }

  const formatSTRN = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '')
    // Format as 00-00-0000-000-00
    let formatted = ''
    if (digits.length > 0) formatted += digits.slice(0, 2)
    if (digits.length > 2) formatted += '-' + digits.slice(2, 4)
    if (digits.length > 4) formatted += '-' + digits.slice(4, 8)
    if (digits.length > 8) formatted += '-' + digits.slice(8, 11)
    if (digits.length > 11) formatted += '-' + digits.slice(11, 13)
    return formatted
  }

  const formatRefNo = (value) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '')
    // Format as 0000000-0
    if (digits.length <= 7) return digits
    return digits.slice(0, 7) + '-' + digits.slice(7, 8)
  }

  const handleNTNChange = (e) => {
    const formatted = formatNTN(e.target.value)
    setFormData(prev => ({ ...prev, company_ntn: formatted }))
  }

  const handleSTRNChange = (e) => {
    const formatted = formatSTRN(e.target.value)
    setFormData(prev => ({ ...prev, company_strn: formatted }))
  }

  const handleRefNoChange = (e) => {
    const formatted = formatRefNo(e.target.value)
    setFormData(prev => ({ ...prev, company_ref_no: formatted }))
  }

  const checkRegistrationStatus = async () => {
    if (!formData.company_ntn || formData.company_ntn.length !== 7) {
      toast.error('Please enter a valid 7-digit NTN')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/fbr/statl/check?ntn=${formData.company_ntn}`)
      const data = await response.json()

      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          fbr_registration_status: data.status,
          company_province: data.province || prev.company_province
        }))
        toast.success(`Registration Status: ${data.status}`)
      } else {
        toast.error(data.error || 'Failed to check registration status')
      }
    } catch (error) {
      toast.error('Failed to check registration status')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Settings updated successfully')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update settings')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleTokenVisibility = (type) => {
    setShowTokens(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your account and FBR tax information
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('fbr')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fbr'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            FBR Tax Information
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Employee ID
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
        )}

        {/* FBR Tax Information Tab */}
        {activeTab === 'fbr' && (
          <div className="space-y-6">
            {/* Company Tax Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Company Tax Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    NTN (National Tax Number)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="company_ntn"
                      value={formData.company_ntn}
                      onChange={handleNTNChange}
                      placeholder="1234567"
                      maxLength="7"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={checkRegistrationStatus}
                      disabled={loading || formData.company_ntn.length !== 7}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Check
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    7-digit tax number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    STRN (Sales Tax Registration Number)
                  </label>
                  <input
                    type="text"
                    name="company_strn"
                    value={formData.company_strn}
                    onChange={handleSTRNChange}
                    placeholder="00-00-0000-000-00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Format: 00-00-0000-000-00
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    name="company_ref_no"
                    value={formData.company_ref_no}
                    onChange={handleRefNoChange}
                    placeholder="0000000-0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Format: 0000000-0
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Registration Status
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-900 dark:border-gray-600">
                    {formData.fbr_registration_status === 'Active' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {formData.fbr_registration_status === 'Inactive' && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {formData.fbr_registration_status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Province
                </label>
                <input
                  type="text"
                  name="company_province"
                  value={formData.company_province}
                  onChange={handleInputChange}
                  placeholder="Punjab, Sindh, KPK, Balochistan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  name="company_address"
                  value={formData.company_address}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Complete business address"
                />
              </div>
            </div>

            {/* FBR API Tokens */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                FBR API Tokens
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sandbox Token (Testing)
                </label>
                <div className="relative">
                  <input
                    type={showTokens.sandbox ? 'text' : 'password'}
                    name="fbr_sandbox_token"
                    value={formData.fbr_sandbox_token}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                    placeholder="Enter your FBR sandbox API token"
                  />
                  <button
                    type="button"
                    onClick={() => toggleTokenVisibility('sandbox')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showTokens.sandbox ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Used for testing invoice submissions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Production Token (Live)
                </label>
                <div className="relative">
                  <input
                    type={showTokens.production ? 'text' : 'password'}
                    name="fbr_production_token"
                    value={formData.fbr_production_token}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                    placeholder="Enter your FBR production API token"
                  />
                  <button
                    type="button"
                    onClick={() => toggleTokenVisibility('production')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showTokens.production ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                  Use with caution - this will submit real invoices to FBR
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
