import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendTemporaryPassword(to: string, tempPassword: string) {
  const html = `
    <div style="max-width: 480px; margin: 0 auto; font-family: sans-serif;">
      <h2 style="color: #3b82f6; text-align: center;">지옹's 미니홈피</h2>
      <p>임시 비밀번호가 발급되었습니다.</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
        <strong style="font-size: 20px; letter-spacing: 2px;">${tempPassword}</strong>
      </div>
      <p style="color: #64748b; font-size: 14px;">
        로그인 후 반드시 비밀번호를 변경해주세요.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: `"지옹's 미니홈피" <${process.env.GMAIL_USER}>`,
    to,
    subject: '[미니홈피] 임시 비밀번호 발급',
    html,
  })
}

export async function sendNotificationEmail(to: string, message: string, link?: string) {
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const linkHtml = link
    ? `<a href="${siteUrl}${link}" style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">확인하러 가기</a>`
    : ''

  const html = `
    <div style="max-width: 480px; margin: 0 auto; font-family: sans-serif;">
      <h2 style="color: #3b82f6; text-align: center;">지옹's 미니홈피</h2>
      <p>${message}</p>
      <div style="text-align: center; margin: 16px 0;">
        ${linkHtml}
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center;">
        이 알림을 받고 싶지 않으시면 설정에서 이메일 알림을 끄실 수 있습니다.
      </p>
    </div>
  `

  await transporter.sendMail({
    from: `"지옹's 미니홈피" <${process.env.GMAIL_USER}>`,
    to,
    subject: '[미니홈피] 새 알림이 있습니다',
    html,
  })
}

export function generateTempPassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const special = '!@#$%'
  let password = ''
  for (let i = 0; i < 6; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  password += special[Math.floor(Math.random() * special.length)]
  password += String(Math.floor(Math.random() * 10))
  return password
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`
  }
  return `${local.slice(0, 2)}${'*'.repeat(local.length - 2)}@${domain}`
}
