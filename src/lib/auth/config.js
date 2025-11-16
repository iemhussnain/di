/**
 * NextAuth Configuration
 * Authentication setup for ERP system
 */

import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/db/mongodb'

// For now, we'll use a simple in-memory user
// In Phase 1, we'll create a proper User model
const users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@erp.com',
    password: '$2a$10$ZQ5X3wZ8F.YU8qH8G.QN8.oK2KZ5fJ9K5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', // 'admin123'
    role: 'Admin',
  },
]

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        // Connect to database
        await connectDB()

        // Find user (temporary - will use database in Phase 1)
        const user = users.find((u) => u.email === credentials.email)

        if (!user) {
          throw new Error('Invalid email or password')
        }

        // For demo, accept 'admin123' as password
        // In production, use: const isValid = await bcrypt.compare(credentials.password, user.password)
        const isValid = credentials.password === 'admin123'

        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}
