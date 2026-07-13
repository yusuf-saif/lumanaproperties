'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotFormValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
  })

  async function onSubmit(data: ForgotFormValues) {
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg bg-success/10 p-4 text-center">
        <p className="text-sm text-success">
          If an account exists for that email, you will receive a reset link shortly.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Back to sign in
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-main"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="you@company.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full">
        Send reset link
      </Button>

      <div className="text-center">
        <a
          href="/login"
          className="text-sm text-primary hover:underline"
        >
          Back to sign in
        </a>
      </div>
    </form>
  )
}
