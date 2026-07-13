import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ResetPasswordForm from '@/components/forms/ResetPasswordForm'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  const token = searchParams.token

  if (!token) {
    redirect('/forgot-password')
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  })

  if (!resetToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-text-main">LUMANA</h1>
          <p className="mt-4 text-sm text-danger">
            Invalid or expired reset link.
          </p>
          <a
            href="/forgot-password"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Request a new reset link
          </a>
        </div>
      </div>
    )
  }

  if (resetToken.used) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-text-main">LUMANA</h1>
          <p className="mt-4 text-sm text-danger">
            This reset link has already been used.
          </p>
          <a
            href="/forgot-password"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Request a new reset link
          </a>
        </div>
      </div>
    )
  }

  if (new Date() > resetToken.expiresAt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sidebar">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-text-main">LUMANA</h1>
          <p className="mt-4 text-sm text-danger">
            This reset link has expired.
          </p>
          <a
            href="/forgot-password"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            Request a new reset link
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-main">LUMANA</h1>
          <p className="mt-1 text-sm text-text-sub">Set your new password</p>
        </div>
        <ResetPasswordForm token={token} />
      </div>
    </div>
  )
}
