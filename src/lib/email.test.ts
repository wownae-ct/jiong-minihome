vi.mock('nodemailer', () => {
  const sendMail = vi.fn().mockResolvedValue({ messageId: 'test-id' })
  return {
    default: {
      createTransport: vi.fn(() => ({ sendMail })),
    },
  }
})

import nodemailer from 'nodemailer'
import { generateTempPassword, maskEmail, sendNotificationEmail } from './email'

const mockTransporter = nodemailer.createTransport() as unknown as { sendMail: ReturnType<typeof vi.fn> }
const mockSendMail = mockTransporter.sendMail

describe('sendNotificationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GMAIL_USER = 'test@gmail.com'
  })

  it('알림 이메일을 발송해야 함', async () => {
    await sendNotificationEmail('user@gmail.com', '새 댓글이 달렸습니다', '/community/free/1')

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@gmail.com',
        subject: '[미니홈피] 새 알림이 있습니다',
      })
    )
  })

  it('이메일 본문에 알림 메시지가 포함되어야 함', async () => {
    await sendNotificationEmail('user@gmail.com', '홍길동님이 좋아요를 눌렀습니다', '/community/free/1')

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('홍길동님이 좋아요를 눌렀습니다')
  })

  it('링크가 있으면 이메일 본문에 포함되어야 함', async () => {
    await sendNotificationEmail('user@gmail.com', '새 댓글', '/community/free/1')

    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.html).toContain('/community/free/1')
  })

  it('링크가 없어도 발송되어야 함', async () => {
    await sendNotificationEmail('user@gmail.com', '새 알림')

    expect(mockSendMail).toHaveBeenCalled()
  })
})

describe('maskEmail', () => {
  it('이메일의 로컬 부분을 마스킹해야 함', () => {
    expect(maskEmail('jiong@gmail.com')).toBe('ji***@gmail.com')
  })

  it('짧은 이메일도 마스킹해야 함', () => {
    expect(maskEmail('ab@test.com')).toBe('a*@test.com')
  })

  it('1자 이메일은 첫 글자만 보여야 함', () => {
    expect(maskEmail('a@test.com')).toBe('a*@test.com')
  })

  it('긴 이메일도 앞 2자만 보여야 함', () => {
    expect(maskEmail('longusername@domain.com')).toBe('lo**********@domain.com')
  })
})

describe('generateTempPassword', () => {
  it('8자 임시 비밀번호를 생성해야 함', () => {
    const password = generateTempPassword()
    expect(password).toHaveLength(8)
  })

  it('숫자를 포함해야 함', () => {
    const password = generateTempPassword()
    expect(password).toMatch(/\d/)
  })

  it('특수문자를 포함해야 함', () => {
    const password = generateTempPassword()
    expect(password).toMatch(/[!@#$%]/)
  })

  it('매번 다른 비밀번호를 생성해야 함', () => {
    const passwords = new Set(Array.from({ length: 10 }, () => generateTempPassword()))
    expect(passwords.size).toBeGreaterThan(1)
  })
})
