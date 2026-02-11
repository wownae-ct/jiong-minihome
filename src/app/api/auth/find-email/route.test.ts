vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'
import { POST } from './route'

const mockFindUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>

function createRequest(body: object) {
  return new Request('http://localhost/api/auth/find-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/find-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('닉네임으로 마스킹된 이메일을 반환해야 함', async () => {
    mockFindUnique.mockResolvedValue({
      email: 'jiong@gmail.com',
      passwordHash: 'hashedpw',
    })

    const response = await POST(createRequest({ nickname: '지옹' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.email).toBe('ji***@gmail.com')
    expect(data.isOAuth).toBe(false)
  })

  it('OAuth 전용 계정이면 isOAuth true를 반환해야 함', async () => {
    mockFindUnique.mockResolvedValue({
      email: 'oauth@gmail.com',
      passwordHash: null,
    })

    const response = await POST(createRequest({ nickname: 'oauth유저' }))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.email).toBe('oa***@gmail.com')
    expect(data.isOAuth).toBe(true)
  })

  it('존재하지 않는 닉네임이면 404를 반환해야 함', async () => {
    mockFindUnique.mockResolvedValue(null)

    const response = await POST(createRequest({ nickname: '없는유저' }))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('해당 닉네임의 계정을 찾을 수 없습니다')
  })

  it('닉네임이 빈 문자열이면 400을 반환해야 함', async () => {
    const response = await POST(createRequest({ nickname: '' }))

    expect(response.status).toBe(400)
  })
})
