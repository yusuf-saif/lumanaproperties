'use client'

import { useSession, signOut } from 'next-auth/react'
import { Menu } from 'lucide-react'
import NotificationBell from '@/components/layout/NotificationBell'

interface TopbarProps {
  title?: string
  onMenuClick?: () => void
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  const { data: session } = useSession()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-1.5 text-text-sub hover:bg-surface lg:hidden"
          >
            <Menu size={20} />
          </button>
        )}
        {title && (
          <h1 className="text-lg font-semibold text-text-main">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="text-right">
          <p className="text-sm font-medium text-text-main">{session?.user?.name}</p>
          <p className="text-xs text-text-sub">{session?.user?.role?.replace('_', ' ')}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="rounded-lg p-2 text-text-sub hover:bg-surface hover:text-text-main"
        >
          <span className="text-sm font-medium">Sign out</span>
        </button>
      </div>
    </header>
  )
}
