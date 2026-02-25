vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    oAuthAccount: {
      upsert: vi.fn(),
    },
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}))

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
  authorizeCredentials,
  handleJwtCallback,
  handleSessionCallback,
} from './auth-callbacks'

const makeUser = (overrides = {}) => ({
  id: 1,
  email: 'test@test.com',
  passwordHash: 'hashed',
  nickname: 'testuser',
  profileImage: null,
  bio: null,
  role: 'user' as const,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  ...overrides,
})

describe('authorizeCredentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('credentials가 없으면 null을 반환해야 함', async () => {
    const result = await authorizeCredentials({})
    expect(result).toBeNull()
  })

  it('email 또는 password가 없으면 null을 반환해야 함', async () => {
    const result = await authorizeCredentials({ email: 'test@test.com' })
    expect(result).toBeNull()
  })

  it('사용자를 찾을 수 없으면 null을 반환해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const result = await authorizeCredentials({
      email: 'test@test.com',
      password: 'password123',
    })

    expect(result).toBeNull()
  })

  it('passwordHash가 없는 사용자(OAuth 전용)는 null을 반환해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ passwordHash: null })
    )

    const result = await authorizeCredentials({
      email: 'test@test.com',
      password: 'password123',
    })

    expect(result).toBeNull()
  })

  it('비활성 사용자는 null을 반환해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ isActive: false })
    )

    const result = await authorizeCredentials({
      email: 'test@test.com',
      password: 'password123',
    })

    expect(result).toBeNull()
    expect(bcrypt.compare).not.toHaveBeenCalled()
  })

  it('비밀번호가 틀리면 null을 반환해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(makeUser())
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

    const result = await authorizeCredentials({
      email: 'test@test.com',
      password: 'wrong',
    })

    expect(result).toBeNull()
  })

  it('로그인 성공 시 사용자 정보를 반환하고 lastLoginAt을 업데이트해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ profileImage: '/img.png', role: 'admin' })
    )
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const result = await authorizeCredentials({
      email: 'test@test.com',
      password: 'password123',
    })

    expect(result).toEqual({
      id: '1',
      email: 'test@test.com',
      name: 'testuser',
      image: '/img.png',
      role: 'admin',
    })
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { lastLoginAt: expect.any(Date) },
    })
  })
})

describe('handleJwtCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('credentials 로그인 시 token에 id와 role을 설정해야 함', async () => {
    const token = { email: 'test@test.com' }
    const user = { id: '1', role: 'admin' }
    const account = { provider: 'credentials' }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(result.id).toBe('1')
    expect(result.role).toBe('admin')
  })

  it('credentials 로그인 시 token에 picture(프로필 이미지)를 설정해야 함', async () => {
    const token = { email: 'test@test.com' }
    const user = { id: '1', role: 'user', image: 'https://example.com/profile.jpg' }
    const account = { provider: 'credentials' }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(result.picture).toBe('https://example.com/profile.jpg')
  })

  it('user에 image가 없을 때 기존 token.picture를 유지해야 함', async () => {
    const token = { email: 'test@test.com', picture: 'https://existing.com/pic.jpg' }
    const user = { id: '1', role: 'user' }
    const account = { provider: 'credentials' }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(result.picture).toBe('https://existing.com/pic.jpg')
  })

  it('user에 role이 없으면 기본값 "user"를 설정해야 함', async () => {
    const token = { email: 'test@test.com' }
    const user = { id: '1' }
    const account = { provider: 'credentials' }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(result.role).toBe('user')
  })

  it('OAuth 로그인 시 email이 없으면 token을 그대로 반환해야 함', async () => {
    const token = { email: null }
    const user = { id: 'temp' }
    const account = {
      provider: 'kakao',
      providerAccountId: 'kakao123',
    }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(result.email).toBeNull()
  })

  it('OAuth 로그인 시 빈 문자열 email도 거부해야 함', async () => {
    const token = { email: '  ' }
    const user = { id: 'temp' }
    const account = {
      provider: 'kakao',
      providerAccountId: 'kakao123',
    }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(prisma.user.findUnique).not.toHaveBeenCalled()
    expect(result.email).toBe('  ')
  })

  it('OAuth 로그인 시 기존 사용자에 OAuthAccount를 upsert로 연결해야 함', async () => {
    const existingUser = makeUser({ id: 5, email: 'existing@test.com', nickname: 'existing' })

    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser)
    vi.mocked(prisma.oAuthAccount.upsert).mockResolvedValue({} as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const token = { email: 'existing@test.com' }
    const user = { id: 'temp' }
    const account = {
      provider: 'google',
      providerAccountId: 'google123',
    }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(result.id).toBe('5')
    expect(result.role).toBe('user')
    expect(prisma.oAuthAccount.upsert).toHaveBeenCalledWith({
      where: {
        uk_oauth_provider: {
          provider: 'google',
          providerId: 'google123',
        },
      },
      update: {},
      create: {
        userId: 5,
        provider: 'google',
        providerId: 'google123',
      },
    })
  })

  it('OAuth 기존 사용자 로그인 시 lastLoginAt을 업데이트해야 함', async () => {
    const existingUser = makeUser({ id: 5, email: 'existing@test.com' })
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser)
    vi.mocked(prisma.oAuthAccount.upsert).mockResolvedValue({} as never)
    vi.mocked(prisma.user.update).mockResolvedValue({} as never)

    const token = { email: 'existing@test.com' }
    const user = { id: 'temp' }
    const account = { provider: 'naver', providerAccountId: 'naver1' }

    await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { lastLoginAt: expect.any(Date) },
    })
  })

  it('OAuth 로그인 시 비활성 사용자는 token만 반환하고 계정 연결하지 않아야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ id: 5, email: 'inactive@test.com', isActive: false })
    )

    const token = { email: 'inactive@test.com' }
    const user = { id: 'temp' }
    const account = { provider: 'google', providerAccountId: 'g1' }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(prisma.oAuthAccount.upsert).not.toHaveBeenCalled()
    expect(prisma.user.update).not.toHaveBeenCalled()
    // DB 사용자 ID(5)가 아닌 초기값이 유지됨
    expect(result.id).not.toBe('5')
  })

  it('OAuth 새 사용자 생성 시 OAuth 토큰을 저장하지 않아야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(
      makeUser({ id: 10, email: 'new@test.com', nickname: 'NewUser' })
    )

    const token = { email: 'new@test.com', name: 'NewUser', picture: 'https://img.com/pic.jpg' }
    const user = { id: 'temp' }
    const account = {
      provider: 'naver',
      providerAccountId: 'naver456',
      access_token: 'should-not-be-stored',
      refresh_token: 'should-not-be-stored',
    }

    await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    const createArgs = vi.mocked(prisma.user.create).mock.calls[0][0]
    const oauthData = createArgs.data.oauthAccounts?.create as Record<string, unknown>
    expect(oauthData).not.toHaveProperty('accessToken')
    expect(oauthData).not.toHaveProperty('refreshToken')
    expect(oauthData.provider).toBe('naver')
    expect(oauthData.providerId).toBe('naver456')
  })

  it('OAuth 새 사용자 생성 시 nickname 중복이면 suffix를 붙여 재시도해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const uniqueError = new Error('Unique constraint failed')
    Object.assign(uniqueError, { code: 'P2002', meta: { target: ['nickname'] } })
    vi.mocked(prisma.user.create)
      .mockRejectedValueOnce(uniqueError)
      .mockResolvedValueOnce(
        makeUser({ id: 11, email: 'dup@test.com', nickname: 'DupName_abc1' })
      )

    const token = { email: 'dup@test.com', name: 'DupName', picture: null }
    const user = { id: 'temp' }
    const account = { provider: 'kakao', providerAccountId: 'kakao789' }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(result.id).toBe('11')
    expect(prisma.user.create).toHaveBeenCalledTimes(2)
    const secondCallNickname = vi.mocked(prisma.user.create).mock.calls[1][0].data.nickname
    expect(secondCallNickname).not.toBe('DupName')
    expect(secondCallNickname).toContain('DupName_')
  })

  it('OAuth 새 사용자 생성 시 email 중복이면 기존 사용자로 연결해야 함', async () => {
    // 첫 findUnique: 사용자 없음 (동시 요청 사이 생성됨)
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(null)
      // email P2002 후 재조회: 사용자 있음
      .mockResolvedValueOnce(makeUser({ id: 20, email: 'race@test.com' }))

    const emailError = new Error('Unique constraint failed')
    Object.assign(emailError, { code: 'P2002', meta: { target: ['email'] } })
    vi.mocked(prisma.user.create).mockRejectedValueOnce(emailError)

    const token = { email: 'race@test.com', name: 'RaceUser', picture: null }
    const user = { id: 'temp' }
    const account = { provider: 'google', providerAccountId: 'g_race' }

    const result = await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    expect(result.id).toBe('20')
    expect(prisma.user.create).toHaveBeenCalledTimes(1)
  })

  it('OAuth 새 사용자 생성 시 name이 없으면 user_ prefix를 사용해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(
      makeUser({ id: 12, email: 'noname@test.com', nickname: 'user_1234' })
    )

    const token = { email: 'noname@test.com', name: null, picture: null }
    const user = { id: 'temp' }
    const account = { provider: 'google', providerAccountId: 'g999' }

    await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    const callNickname = vi.mocked(prisma.user.create).mock.calls[0][0].data.nickname as string
    expect(callNickname).toMatch(/^user_\d+$/)
  })

  it('nickname 재시도가 모두 실패하면 에러를 throw해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const uniqueError = new Error('Unique constraint failed')
    Object.assign(uniqueError, { code: 'P2002', meta: { target: ['nickname'] } })
    vi.mocked(prisma.user.create)
      .mockRejectedValue(uniqueError)

    const token = { email: 'fail@test.com', name: 'Fail', picture: null }
    const user = { id: 'temp' }
    const account = { provider: 'kakao', providerAccountId: 'k_fail' }

    await expect(
      handleJwtCallback({
        token: token as never,
        user: user as never,
        account: account as never,
      })
    ).rejects.toThrow('Unique constraint failed')

    // MAX_RETRIES(3) + 1 = 4번 시도
    expect(prisma.user.create).toHaveBeenCalledTimes(4)
  })

  it('trigger가 "update"이면 DB에서 최신 사용자 정보를 가져와야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      makeUser({ id: 1, profileImage: 'https://new-image.com/pic.jpg', nickname: 'updatedName' })
    )

    const token = { id: '1', role: 'user', picture: 'https://old-image.com/pic.jpg', name: 'oldName' }

    const result = await handleJwtCallback({
      token: token as never,
      trigger: 'update',
    })

    expect(result.picture).toBe('https://new-image.com/pic.jpg')
    expect(result.name).toBe('updatedName')
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { profileImage: true, nickname: true, role: true },
    })
  })

  it('trigger가 "update"이고 사용자가 없으면 token을 그대로 반환해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const token = { id: '999', role: 'user', picture: 'https://old.com/pic.jpg' }

    const result = await handleJwtCallback({
      token: token as never,
      trigger: 'update',
    })

    expect(result.picture).toBe('https://old.com/pic.jpg')
  })

  it('P2002 외의 Prisma 에러는 즉시 throw해야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const otherError = new Error('Connection error')
    Object.assign(otherError, { code: 'P1001' })
    vi.mocked(prisma.user.create).mockRejectedValue(otherError)

    const token = { email: 'err@test.com', name: 'Err', picture: null }
    const user = { id: 'temp' }
    const account = { provider: 'google', providerAccountId: 'g_err' }

    await expect(
      handleJwtCallback({
        token: token as never,
        user: user as never,
        account: account as never,
      })
    ).rejects.toThrow('Connection error')

    expect(prisma.user.create).toHaveBeenCalledTimes(1)
  })

  it('긴 nickname은 50자 이내로 잘라야 함', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(
      makeUser({ id: 13, email: 'long@test.com' })
    )

    const longName = 'A'.repeat(60)
    const token = { email: 'long@test.com', name: longName, picture: null }
    const user = { id: 'temp' }
    const account = { provider: 'google', providerAccountId: 'g_long' }

    await handleJwtCallback({
      token: token as never,
      user: user as never,
      account: account as never,
    })

    const callNickname = vi.mocked(prisma.user.create).mock.calls[0][0].data.nickname as string
    expect(callNickname.length).toBeLessThanOrEqual(50)
  })
})

describe('handleSessionCallback', () => {
  it('session.user에 id와 role을 설정해야 함', async () => {
    const session = {
      user: { id: '', email: 'test@test.com', name: 'Test', role: '' },
      expires: '',
    }
    const token = { id: '42', role: 'admin' }

    const result = await handleSessionCallback({
      session: session as never,
      token: token as never,
    })

    expect(result.user.id).toBe('42')
    expect(result.user.role).toBe('admin')
  })

  it('session.user에 image(프로필 이미지)를 설정해야 함', async () => {
    const session = {
      user: { id: '', email: 'test@test.com', name: 'Test', role: '', image: undefined },
      expires: '',
    }
    const token = { id: '42', role: 'user', picture: 'https://example.com/profile.jpg' }

    const result = await handleSessionCallback({
      session: session as never,
      token: token as never,
    })

    expect(result.user.image).toBe('https://example.com/profile.jpg')
  })

  it('token.picture가 없으면 session.user.image는 undefined여야 함', async () => {
    const session = {
      user: { id: '', email: 'test@test.com', name: 'Test', role: '' },
      expires: '',
    }
    const token = { id: '42', role: 'user' }

    const result = await handleSessionCallback({
      session: session as never,
      token: token as never,
    })

    expect(result.user.image).toBeUndefined()
  })
})
