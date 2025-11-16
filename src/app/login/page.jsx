/**
 * Login Page
 * User authentication page with password visibility toggle
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@erp.com')
  const [password, setPassword] = useState('admin123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Simple authentication for now
      // In production, this will call NextAuth API
      if (email === 'admin@erp.com' && password === 'admin123') {
        toast.success('Login successful!')
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Invalid email or password')
        toast.error('Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred during login')
      toast.error('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            ERP System
          </CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@erp.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" required>
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Sign In
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-blue-600 dark:text-blue-400 hover:underline">
                Register
              </Link>
            </div>

            {/* Demo Credentials */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500 dark:text-gray-400">
              <p className="font-medium mb-1">Demo Credentials:</p>
              <p>Email: admin@erp.com</p>
              <p>Password: admin123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
