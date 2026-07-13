import { Resend } from 'resend'

function getFromEmail(): string {
  return process.env.FROM_EMAIL ?? 'noreply@lumana.ng'
}

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

function baseLayout(title: string, content: string): string {
  return `
    <div style="background:#F8FAFC;padding:40px 20px;font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="margin:0;font-size:24px;font-weight:700;color:#0F172A;letter-spacing:0.5px;">LUMANA</h1>
        </div>
        <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#0F172A;">${title}</h2>
        ${content}
        <hr style="border:none;border-top:1px solid #E2E8F0;margin:32px 0 20px;">
        <p style="margin:0;font-size:12px;color:#64748B;text-align:center;">Lumana Hotel Apartments Operations Dashboard</p>
      </div>
    </div>
  `
}

function button(href: string, label: string): string {
  return `
    <div style="margin:24px 0;">
      <a href="${href}" style="display:inline-block;background:#2563EB;color:#FFFFFF;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">${label}</a>
    </div>
  `
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#334155;">${text}</p>`
}

export async function sendInviteEmail({
  to,
  inviteUrl,
  role,
  inviterName,
}: {
  to: string
  inviteUrl: string
  role: string
  inviterName: string
}) {
  const client = getClient()
  if (!client) {
    console.log(`[Invite Email] No RESEND_API_KEY. To: ${to}, role: ${role}`)
    return
  }

  const html = baseLayout(
    'You\'ve been invited',
    `${paragraph(`${inviterName} has invited you to join the Lumana Operations Dashboard as <strong>${role.replace('_', ' ')}</strong>.`)}
     ${button(inviteUrl, 'Accept Invitation')}
     ${paragraph('This link expires in 48 hours. If you did not expect this invitation, you can safely ignore this email.')}`
  )

  try {
    await client.emails.send({
      from: getFromEmail(),
      to,
      subject: "You've been invited to Lumana Operations Dashboard",
      html,
    })
  } catch (err) {
    console.error('Failed to send invite email:', err)
  }
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string
  resetUrl: string
}) {
  const client = getClient()
  if (!client) {
    console.log(`[Reset Email] No RESEND_API_KEY. To: ${to}`)
    return
  }

  const html = baseLayout(
    'Reset your password',
    `${paragraph('You requested a password reset for your Lumana Operations Dashboard account.')}
     ${button(resetUrl, 'Reset Password')}
     ${paragraph('This link expires in 1 hour. If you did not request this, you can safely ignore this email.')}`
  )

  try {
    await client.emails.send({
      from: getFromEmail(),
      to,
      subject: 'Reset your Lumana Dashboard password',
      html,
    })
  } catch (err) {
    console.error('Failed to send reset email:', err)
  }
}

export async function sendMaintenanceAlertEmail({
  to,
  issueTitle,
  propertyName,
  priority,
  issueUrl,
}: {
  to: string
  issueTitle: string
  propertyName: string
  priority: string
  issueUrl: string
}) {
  const client = getClient()
  if (!client) {
    console.log(`[Maintenance Alert Email] No RESEND_API_KEY. To: ${to}, issue: ${issueTitle}`)
    return
  }

  const html = baseLayout(
    `${priority} Maintenance Issue`,
    `${paragraph(`A <strong>${priority.toLowerCase()}</strong> maintenance issue has been reported at <strong>${propertyName}</strong>.`)}
     ${paragraph(`<strong>Issue:</strong> ${issueTitle}`)}
     ${button(issueUrl, 'View Issue')}`
  )

  try {
    await client.emails.send({
      from: getFromEmail(),
      to,
      subject: `[${priority}] Maintenance Issue: ${issueTitle}`,
      html,
    })
  } catch (err) {
    console.error('Failed to send maintenance alert email:', err)
  }
}
