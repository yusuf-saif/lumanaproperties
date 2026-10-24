import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/forms/LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string }
}) {
  const session = await auth()

  if (session?.user?.id) {
    redirect('/')
  }

  const errorMessage =
    searchParams?.error === 'CredentialsSignin'
      ? 'Invalid email or password.'
      : searchParams?.error
        ? 'Authentication error. Please try again.'
        : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-main">LUMANA</h1>
          <p className="mt-1 text-sm text-primary">Operations Dashboard</p>
        </div>
        {errorMessage && (
          <div className="mb-4 rounded-lg bg-danger/10 p-3 text-sm text-danger">
            {errorMessage}
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  )
}
