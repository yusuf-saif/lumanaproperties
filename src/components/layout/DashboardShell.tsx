'use client'

import { useState, useCallback } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { Menu } from 'lucide-react'
import type { Session } from 'next-auth'

interface Props {
  children: React.ReactNode
  session: Session
}

export default function DashboardShell({ children, session }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} session={session} />

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-64">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-40 rounded-lg bg-card p-2 text-text-sub shadow-md hover:bg-surface lg:hidden"
        >
          <Menu size={20} />
        </button>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
