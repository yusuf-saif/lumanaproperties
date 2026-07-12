'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatEnum } from '@/lib/utils/format'
import { UserPlus, Mail, Shield, Building, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  role: string
  active: boolean
  createdAt: string
  properties: Array<{ id: string; name: string }>
}

interface UserManagerProps {
  initialUsers: UserData[]
  properties: Array<{ id: string; name: string }>
}

export function UserManager({ initialUsers, properties }: UserManagerProps) {
  const [users, setUsers] = useState(initialUsers)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('STAFF')
  const [inviteProperties, setInviteProperties] = useState<string[]>([])
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editProperties, setEditProperties] = useState<string[]>([])

  async function sendInvite() {
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    setInviteSent(false)

    try {
      const res = await fetch('/api/settings/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
          propertyIds: inviteProperties,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invite')
        return
      }

      setInviteSent(true)
      setInviteEmail('')
      setInviteRole('STAFF')
      setInviteProperties([])
    } catch {
      setInviteError('Network error')
    } finally {
      setInviting(false)
    }
  }

  async function updateUser(id: string) {
    const res = await fetch(`/api/settings/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: editRole, propertyIds: editProperties }),
    })

    if (res.ok) {
      setUsers((prev) => prev.map((u) => {
        if (u.id !== id) return u
        const matchedProps = properties.filter((p) => editProperties.includes(p.id))
        return { ...u, role: editRole, properties: matchedProps }
      }))
      setEditingUserId(null)
    }
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch(`/api/settings/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })

    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active } : u))
    }
  }

  function toggleInviteProperty(id: string) {
    setInviteProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function toggleEditProperty(id: string) {
    setEditProperties((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-medium text-text-main mb-4 flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invite New User
        </h3>

        {inviteSent && (
          <div className="mb-4 p-3 bg-success/10 border border-success/20 rounded-lg flex items-center gap-2 text-success text-sm">
            <CheckCircle className="h-4 w-4" />
            Invite sent successfully. The user will receive an email with a link to set up their account.
          </div>
        )}

        {inviteError && (
          <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg flex items-center gap-2 text-danger text-sm">
            <XCircle className="h-4 w-4" />
            {inviteError}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-text-sub mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-sub" />
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="text-xs font-medium text-text-sub mb-1 block">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-sub" />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="PROPERTY_MANAGER">Property Manager</option>
                  <option value="STAFF">Staff</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text-sub mb-1 block">Properties</label>
            <div className="flex flex-wrap gap-2">
              {properties.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleInviteProperty(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                    inviteProperties.includes(p.id)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}>
            {inviting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Invite
              </>
            )}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-text-main">Users ({users.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {users.map((user) => {
            const isEditing = editingUserId === user.id

            return (
              <div key={user.id} className="p-4 hover:bg-surface transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-text-sub">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={user.active ? 'success' : 'default'}>
                      {user.active ? 'Active' : 'Inactive'}
                    </Badge>

                    {isEditing ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="border border-border rounded px-2 py-1 text-sm"
                        >
                          <option value="SUPER_ADMIN">Super Admin</option>
                          <option value="PROPERTY_MANAGER">Property Manager</option>
                          <option value="STAFF">Staff</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                        <Button size="sm" onClick={() => updateUser(user.id)}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingUserId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <>
                        <Badge variant="info">{formatEnum(user.role)}</Badge>
                        <div className="flex items-center gap-1">
                          {user.properties.map((p) => (
                            <Badge key={p.id} variant="default" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <div className="flex gap-2 mt-3 ml-14">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingUserId(user.id)
                        setEditRole(user.role)
                        setEditProperties(user.properties.map((p) => p.id))
                      }}
                    >
                      Edit Role
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(user.id, !user.active)}
                    >
                      {user.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                )}

                {isEditing && (
                  <div className="mt-3 ml-14">
                    <label className="text-xs font-medium text-text-sub mb-1 block">Assigned Properties</label>
                    <div className="flex flex-wrap gap-2">
                      {properties.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => toggleEditProperty(p.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            editProperties.includes(p.id)
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
