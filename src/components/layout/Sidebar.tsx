'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Wrench,
  DollarSign,
  FileText,
  ClipboardList,
  LogOut,
  Building2,
  UserCircle,
  Users,
  BarChart2,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Session } from 'next-auth'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'STAFF', 'VIEWER'] },
  { href: '/properties', label: 'Properties', icon: Building2, roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER'] },
  { href: '/analytics', label: 'Analytics', icon: BarChart2, roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'STAFF', 'VIEWER'] },
  { href: '/submit', label: 'Submit Report', icon: ClipboardList, roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'STAFF', 'VIEWER'] },
  { href: '/income', label: 'Income', icon: DollarSign, roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'STAFF', 'VIEWER'] },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'STAFF', 'VIEWER'] },
  { href: '/reports', label: 'View Reports', icon: FileText, roles: ['SUPER_ADMIN', 'PROPERTY_MANAGER', 'STAFF', 'VIEWER'] },
]

const settingsItems = [
  { href: '/settings/properties', label: 'Properties', icon: Building2, roles: ['SUPER_ADMIN'] },
  { href: '/settings/users', label: 'Users', icon: Users, roles: ['SUPER_ADMIN'] },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  session?: Session | null
}

export default function Sidebar({ isOpen, onClose, session: propSession }: SidebarProps) {
  const pathname = usePathname()
  const { data: hookSession } = useSession()
  const session = propSession ?? hookSession
  const userRole = session?.user?.role

  const filteredNav = userRole
    ? navItems.filter(item => item.roles.includes(userRole))
    : navItems
  const filteredSettings = userRole
    ? settingsItems.filter(item => item.roles.includes(userRole))
    : []

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col bg-sidebar">
        <SidebarContent
          pathname={pathname}
          user={session?.user}
          navItems={filteredNav}
          settingsItems={filteredSettings}
        />
      </aside>

      {/* Mobile sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={onClose}
          />
          {/* Slide-in panel */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transition-transform duration-200 ease-in-out">
            <SidebarContent
              pathname={pathname}
              user={session?.user}
              navItems={filteredNav}
              settingsItems={filteredSettings}
            />
          </aside>
        </div>
      )}
    </>
  )
}

function SidebarContent({
  pathname,
  user,
  navItems: nav,
  settingsItems: settings,
}: {
  pathname: string
  user: { name?: string | null; role?: string | null } | undefined
  navItems: typeof navItems
  settingsItems: typeof settingsItems
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-center border-b border-white/10">
        <h1 className="text-xl font-bold text-white">LUMANA</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          )
        })}

        {settings.length > 0 && (
          <>
            <div className="my-3 border-t border-white/10" />
            <p className="px-3 py-1 text-xs font-semibold uppercase text-white/40">Admin</p>
            {settings.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-xs text-white/50">{user?.role?.replace('_', ' ')}</p>
        </div>
        <Link
          href="/profile"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
            pathname === '/profile'
              ? 'bg-white/10 text-white'
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          )}
        >
          <UserCircle size={20} />
          Profile
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={20} />
          Sign out
        </button>
      </div>
    </div>
  )
}
