vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/email', () => ({
  sendTemporaryPassword: vi.fn(),
  generateTempPassword: vi.fn(() => 'Temp1234!'),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashedTempPw')),
  },
}))

import { prisma } from '@/lib/prisma'
import { sendTemporaryPassword } from '@/lib/email'
import { POST } from './route'

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>
const mockUpdate = prisma.user.update as ReturnType<typeof vi.fn>
const mockSendEmail = sendTemporaryPassword as ReturnType<typeof vi.fn>

function createRequest(body: object) {
  return new Request('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('임시 비밀번호를 발급하고 이메일을 발송해야 함', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      email: 'test@gmail.com',
      passwordHash: 'existingHash',
    })
    mockUpdate.mockResolvedValue({})
    mockSendEmail.mockResolvedValue(undefined)

    const response = await POST(createRequest({ email: 'test@gmail.com' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('임시 비밀번호가 이메일로 발송되었습니다')
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { passwordHash: 'hashedTempPw' },
    })
    expect(mockSendEmail).toHaveBeenCalledWith('test@gmail.com', 'Temp1234!')
  })

  it('존재하지 않는 이메일이면 404를 반환해야 함', async () => {
    mockFindUnique.mockResolvedValue(null)

    const response = await POST(createRequest({ email: 'none@gmail.com' }))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('해당 이메일의 계정을 찾을 수 없습니다')
  })

  it('OAuth 전용 계정이면 400을 반환해야 함', async () => {
    mockFindUnique.mockResolvedValue({
      id: 2,
      email: 'oauth@gmail.com',
      passwordHash: null,
    })

    const response = await POST(createRequest({ email: 'oauth@gmail.com' }))
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('소셜 로그인으로 가입된 계정입니다. 해당 소셜 서비스로 로그인해주세요.')
  })

  it('유효하지 않은 이메일이면 400을 반환해야 함', async () => {
    const response = await POST(createRequest({ email: 'invalid' }))

    expect(response.status).toBe(400)
  })

  it('이메일 발송 실패 시 비밀번호가 변경되지 않아야 함', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      email: 'test@gmail.com',
      passwordHash: 'existingHash',
    })
    mockSendEmail.mockRejectedValue(new Error('SMTP auth failed'))

    const response = await POST(createRequest({ email: 'test@gmail.com' }))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('이메일 발송 성공 후에만 비밀번호를 업데이트해야 함', async () => {
    mockFindUnique.mockResolvedValue({
      id: 1,
      email: 'test@gmail.com',
      passwordHash: 'existingHash',
    })
    mockSendEmail.mockResolvedValue(undefined)
    mockUpdate.mockResolvedValue({})

    const response = await POST(createRequest({ email: 'test@gmail.com' }))

    expect(response.status).toBe(200)

    // sendEmail이 update보다 먼저 호출되었는지 확인
    const sendEmailCallOrder = mockSendEmail.mock.invocationCallOrder[0]
    const updateCallOrder = mockUpdate.mock.invocationCallOrder[0]
    expect(sendEmailCallOrder).toBeLessThan(updateCallOrder)
  })
})
