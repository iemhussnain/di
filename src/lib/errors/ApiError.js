/**
 * Custom API Error Class
 * Used for throwing errors with specific status codes
 */

export class ApiError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

// Predefined error types
export class BadRequestError extends ApiError {
  constructor(message = 'Bad request', details = null) {
    super(message, 400, details)
    this.name = 'BadRequestError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(message, 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 422, details)
    this.name = 'ValidationError'
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Resource already exists') {
    super(message, 409)
    this.name = 'ConflictError'
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(message, 500)
    this.name = 'InternalServerError'
  }
}
