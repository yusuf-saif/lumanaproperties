'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Wrench,
  DollarSign,
  FileText,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Role } from '@prisma/client'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: Role[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Maintenance', href: '/maintenance', icon: <Wrench size={20} /> },
  { label: 'Income', href: '/income', icon: <DollarSign size={20} /> },
  { label: 'Reports', href: '/reports', icon: <FileText size={20} /> },
  {
    label: 'Submit Report',
    href: '/submit',
    icon: <ClipboardList size={20} />,
    roles: ['STAFF', 'PROPERTY_MANAGER'],
  },
  {
    label: 'Settings',
    href: '/settings/properties',
    icon: <Settings size={20} />,
    roles: ['SUPER_ADMIN'],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <div>
          <span className="text-lg font-bold tracking-tight">LUMANA</span>
          <span className="ml-2 text-sm text-primary">Operations</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(user?.role as Role))
          .map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-white/50">{user?.role?.replace('_', ' ')}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={20} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
