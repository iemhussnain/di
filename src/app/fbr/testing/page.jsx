/**
 * FBR Testing Page
 * Test all 28 FBR scenarios for invoice validation and submission
 */

'use client'

import { useState } from 'react'
import { FBR_SCENARIOS } from '@/lib/constants/fbrScenarios'
import toast from 'react-hot-toast'
import { CheckCircle2, XCircle, Loader2, PlayCircle, Upload, AlertCircle } from 'lucide-react'

export default function FBRTestingPage() {
  const [testResults, setTestResults] = useState({})
  const [isTestingAll, setIsTestingAll] = useState(false)
  const [currentlyTesting, setCurrentlyTesting] = useState(null)

  const getStatusIcon = (status) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'valid':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'posted':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      testing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      valid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      invalid: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      error: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      posted: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
    }
    return badges[status] || ''
  }

  const validateScenario = async (scenarioId) => {
    const scenario = FBR_SCENARIOS.find(s => s.id === scenarioId)
    if (!scenario) return

    setCurrentlyTesting(scenarioId)
    setTestResults(prev => ({
      ...prev,
      [scenarioId]: { status: 'testing', message: 'Validating...' }
    }))

    try {
      const response = await fetch('/api/fbr/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario.data)
      })

      const result = await response.json()

      if (response.ok) {
        setTestResults(prev => ({
          ...prev,
          [scenarioId]: {
            status: result.isValid ? 'valid' : 'invalid',
            message: result.message || (result.isValid ? 'Validation successful' : 'Validation failed'),
            data: result.data
          }
        }))
        toast.success(`${scenario.id}: ${result.isValid ? 'Valid' : 'Invalid'}`)
      } else {
        setTestResults(prev => ({
          ...prev,
          [scenarioId]: {
            status: 'error',
            message: result.error || 'Validation failed'
          }
        }))
        toast.error(`${scenario.id}: ${result.error}`)
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [scenarioId]: {
          status: 'error',
          message: error.message
        }
      }))
      toast.error(`${scenario.id}: ${error.message}`)
    } finally {
      setCurrentlyTesting(null)
    }
  }

  const postScenario = async (scenarioId) => {
    const scenario = FBR_SCENARIOS.find(s => s.id === scenarioId)
    if (!scenario) return

    setCurrentlyTesting(scenarioId)
    setTestResults(prev => ({
      ...prev,
      [scenarioId]: { status: 'testing', message: 'Posting to FBR...' }
    }))

    try {
      const response = await fetch('/api/fbr/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scenario.data)
      })

      const result = await response.json()

      if (response.ok) {
        setTestResults(prev => ({
          ...prev,
          [scenarioId]: {
            status: 'posted',
            message: `Posted successfully. Invoice: ${result.invoiceNumber}`,
            invoiceNumber: result.invoiceNumber,
            data: result.data
          }
        }))
        toast.success(`${scenario.id}: Posted successfully`)
      } else {
        setTestResults(prev => ({
          ...prev,
          [scenarioId]: {
            status: 'error',
            message: result.error || 'Posting failed'
          }
        }))
        toast.error(`${scenario.id}: ${result.error}`)
      }
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [scenarioId]: {
          status: 'error',
          message: error.message
        }
      }))
      toast.error(`${scenario.id}: ${error.message}`)
    } finally {
      setCurrentlyTesting(null)
    }
  }

  const postAllScenarios = async () => {
    setIsTestingAll(true)

    for (const scenario of FBR_SCENARIOS) {
      await postScenario(scenario.id)
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setIsTestingAll(false)
    toast.success('All scenarios tested!')
  }

  const clearResults = () => {
    setTestResults({})
    toast.success('Results cleared')
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            FBR Testing Scenarios
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Test all 28 FBR scenarios for invoice validation and submission
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearResults}
            disabled={Object.keys(testResults).length === 0}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Results
          </button>
          <button
            onClick={postAllScenarios}
            disabled={isTestingAll || currentlyTesting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTestingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing All...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Post All Scenarios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Scenarios</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{FBR_SCENARIOS.length}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-4">
          <div className="text-sm text-green-600 dark:text-green-400">Valid</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {Object.values(testResults).filter(r => r.status === 'valid').length}
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg shadow p-4">
          <div className="text-sm text-emerald-600 dark:text-emerald-400">Posted</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {Object.values(testResults).filter(r => r.status === 'posted').length}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow p-4">
          <div className="text-sm text-red-600 dark:text-red-400">Invalid</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            {Object.values(testResults).filter(r => r.status === 'invalid').length}
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-4">
          <div className="text-sm text-yellow-600 dark:text-yellow-400">Errors</div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {Object.values(testResults).filter(r => r.status === 'error').length}
          </div>
        </div>
      </div>

      {/* Scenarios List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {FBR_SCENARIOS.map((scenario) => {
                const result = testResults[scenario.id]
                const isTesting = currentlyTesting === scenario.id

                return (
                  <tr key={scenario.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {scenario.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{scenario.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{scenario.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result ? (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(result.status)}`}>
                            {result.status.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">Not tested</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => validateScenario(scenario.id)}
                          disabled={isTesting || isTestingAll}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <PlayCircle className="w-3 h-3" />
                          Validate
                        </button>
                        <button
                          onClick={() => postScenario(scenario.id)}
                          disabled={isTesting || isTestingAll}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Upload className="w-3 h-3" />
                          Post
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Details */}
      {Object.keys(testResults).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Test Results Details
          </h2>
          <div className="space-y-3">
            {Object.entries(testResults).map(([scenarioId, result]) => (
              <div
                key={scenarioId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {scenarioId}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(result.status)}`}>
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {result.message}
                    </p>
                    {result.invoiceNumber && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        Invoice Number: <span className="font-mono">{result.invoiceNumber}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
