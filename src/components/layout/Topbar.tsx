'use client'

import { Menu } from 'lucide-react'

interface TopbarProps {
  title?: string
  onMenuClick?: () => void
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  return (
    <header className="flex h-16 items-center border-b border-border bg-card px-6">
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
    </header>
  )
}
