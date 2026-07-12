import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/forms/LoginForm'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const session = await auth()

  if (session) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-main">LUMANA</h1>
          <p className="mt-1 text-sm text-primary">Operations Dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
