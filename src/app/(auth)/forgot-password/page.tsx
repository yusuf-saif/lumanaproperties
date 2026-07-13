import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-white p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-main">LUMANA</h1>
          <p className="mt-1 text-sm text-text-sub">Reset your password</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
