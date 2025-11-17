import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import dbConnect from '@/lib/db/mongodb'
import User from '@/lib/models/User'

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
          throw new Error('Please enter email and password')
        }

        await dbConnect()
        
        const user = await User.findByEmail(credentials.email)

        if (!user) {
          throw new Error('Invalid email or password')
        }

        if (user.status !== 'Active') {
          throw new Error(`Account is ${user.status}. Please contact administrator.`)
        }

        const isPasswordValid = await user.comparePassword(credentials.password)

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        // Update last login
        await user.updateLastLogin()

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          employee_id: user.employee_id?.toString(),
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.employee_id = user.employee_id
      }
      return token
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.employee_id = token.employee_id
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-this-in-production',
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
