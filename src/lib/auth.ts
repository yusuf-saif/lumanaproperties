import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import type { Role } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      propertyIds: string[]
      name: string
      email: string
    }
  }

  interface User {
    id: string
    role: Role
    propertyIds: string[]
  }
}

interface CustomToken {
  id?: string
  role?: Role
  propertyIds?: string[]
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            propertyUsers: {
              select: { propertyId: true },
            },
          },
        })

        if (!user || !user.active) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          propertyIds: user.propertyUsers.map((pu) => pu.propertyId),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.propertyIds = user.propertyIds
      }
      return token
    },
    async session({ session, token }) {
      const customToken = token as CustomToken
      if (customToken) {
        session.user.id = customToken.id ?? ''
        session.user.role = customToken.role ?? 'STAFF'
        session.user.propertyIds = customToken.propertyIds ?? []
      }
      return session
    },
    async authorized() {
      return true
    },
  },
})
