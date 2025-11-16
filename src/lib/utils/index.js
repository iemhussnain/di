/**
 * Utility Functions Index
 * Common helper functions used across the ERP
 */

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes
 * @param {...any} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generate UUID
 * @returns {string}
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Capitalize first letter
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Truncate text
 * @param {string} text
 * @param {number} length
 * @returns {string}
 */
export function truncate(text, length = 50) {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

/**
 * Check if object is empty
 * @param {object} obj
 * @returns {boolean}
 */
export function isEmpty(obj) {
  if (!obj) return true
  return Object.keys(obj).length === 0
}

/**
 * Deep clone object
 * @param {any} obj
 * @returns {any}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Remove null/undefined values from object
 * @param {object} obj
 * @returns {object}
 */
export function removeEmpty(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null && v !== '')
  )
}

/**
 * Group array by key
 * @param {Array} array
 * @param {string} key
 * @returns {object}
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key]
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {})
}

/**
 * Sum array values by key
 * @param {Array} array
 * @param {string} key
 * @returns {number}
 */
export function sumBy(array, key) {
  return array.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
}

/**
 * Calculate percentage
 * @param {number} value
 * @param {number} total
 * @returns {number}
 */
export function calculatePercentage(value, total) {
  if (!total || total === 0) return 0
  return (value / total) * 100
}

/**
 * Retry async function
 * @param {Function} fn
 * @param {number} retries
 * @param {number} delay
 * @returns {Promise}
 */
export async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error
    await sleep(delay)
    return retry(fn, retries - 1, delay * 2)
  }
}

// Re-export format utilities
export * from './format'
