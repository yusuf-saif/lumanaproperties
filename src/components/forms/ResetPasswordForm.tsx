'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  })

  async function onSubmit(data: ResetFormValues) {
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || 'Something went wrong. Please try again.')
        return
      }

      router.push('/login?message=Password reset successfully')
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text-main"
        >
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-text-main"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="••••••••"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-danger">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full">
        Reset password
      </Button>
    </form>
  )
}
