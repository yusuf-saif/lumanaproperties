'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormValues) {
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError('root', { message: 'Invalid email or password' })
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-text-main"
        >
          Email
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

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-text-main"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm text-text-main placeholder:text-text-sub focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="••••••••"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
        )}
        <div className="mt-1 text-right">
          <a
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            Forgot password?
          </a>
        </div>
      </div>

      {errors.root && (
        <div className="rounded-lg bg-danger/10 p-3">
          <p className="text-sm text-danger">{errors.root.message}</p>
        </div>
      )}

      <Button
        type="submit"
        loading={isSubmitting}
        className="w-full"
      >
        Sign in
      </Button>
    </form>
  )
}
