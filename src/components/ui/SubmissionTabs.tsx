'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const tabs = [
  { href: '/submit', label: 'Daily Report' },
  { href: '/submit/maintenance', label: 'Log Maintenance' },
  { href: '/submit/income', label: 'Log Income' },
]

export default function SubmissionTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-border mb-6">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-colors -mb-px',
              isActive
                ? 'border-b-2 border-primary text-primary'
                : 'text-text-sub hover:text-text-main hover:bg-surface'
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
