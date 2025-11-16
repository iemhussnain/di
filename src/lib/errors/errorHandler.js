/**
 * Global Error Handler for API Routes
 * Unified error handling with consistent response format
 */

import { NextResponse } from 'next/server'
import { ApiError } from './ApiError'
import { z } from 'zod'

/**
 * Format MongoDB errors
 */
const formatMongoError = (error) => {
  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0]
    return {
      message: `${field} already exists`,
      statusCode: 409,
      details: { field, value: error.keyValue[field] },
    }
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((err) => ({
      field: err.path,
      message: err.message,
    }))
    return {
      message: 'Validation failed',
      statusCode: 422,
      details,
    }
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return {
      message: `Invalid ${error.path}: ${error.value}`,
      statusCode: 400,
    }
  }

  return null
}

/**
 * Format Zod validation errors
 */
const formatZodError = (error) => {
  const details = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return {
    message: 'Validation failed',
    statusCode: 422,
    details,
  }
}

/**
 * Log error (different for dev and production)
 */
const logError = (error, context = {}) => {
  const isDevelopment = process.env.NODE_ENV === 'development'

  if (isDevelopment) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ API ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Context:', context)
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  } else {
    // In production, log only essential info
    console.error('API Error:', {
      name: error.name,
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Main error handler
 */
export const errorHandler = (error, context = {}) => {
  logError(error, context)

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const formatted = formatZodError(error)
    return NextResponse.json(
      {
        success: false,
        error: formatted.message,
        details: formatted.details,
      },
      { status: formatted.statusCode }
    )
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode }
    )
  }

  // Handle MongoDB errors
  const mongoError = formatMongoError(error)
  if (mongoError) {
    return NextResponse.json(
      {
        success: false,
        error: mongoError.message,
        ...(mongoError.details && { details: mongoError.details }),
      },
      { status: mongoError.statusCode }
    )
  }

  // Handle unknown errors
  const isDevelopment = process.env.NODE_ENV === 'development'
  return NextResponse.json(
    {
      success: false,
      error: isDevelopment ? error.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: error.stack }),
    },
    { status: 500 }
  )
}

/**
 * Async handler wrapper for API routes
 * Wraps async functions to automatically catch errors
 */
export const asyncHandler = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      return errorHandler(error, {
        handler: fn.name || 'anonymous',
      })
    }
  }
}

/**
 * Try-catch wrapper for API route handlers
 */
export const withErrorHandler = (handler) => {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      return errorHandler(error, {
        url: request.url,
        method: request.method,
      })
    }
  }
}

export default errorHandler
