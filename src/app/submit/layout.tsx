import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SidebarStatic from '@/components/layout/SidebarStatic'

export default async function SubmitLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-surface">
      <SidebarStatic />
      <main className="ml-64 min-h-screen">{children}</main>
    </div>
  )
}
