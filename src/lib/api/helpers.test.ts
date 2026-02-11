/**
 * @vitest-environment node
 */
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn() },
}))

import { auth } from '@/lib/auth'
import {
  requireAdmin,
  requireAuth,
  parseId,
  parsePagination,
  verifyGuestPassword,
  formatZodError,
} from './helpers'

const mockAuth = vi.mocked(auth)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAdmin', () => {
  it('세션이 없으면 401 응답을 반환해야 한다', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await requireAdmin()
    expect(result.error).toBeDefined()
    expect(result.session).toBeUndefined()
  })

  it('admin이 아니면 403 응답을 반환해야 한다', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'user', name: 'test', email: 'a@b.com' },
      expires: '',
    } as never)
    const result = await requireAdmin()
    expect(result.error).toBeDefined()
    expect(result.session).toBeUndefined()
  })

  it('admin이면 세션을 반환해야 한다', async () => {
    const session = {
      user: { id: '1', role: 'admin', name: 'admin', email: 'a@b.com' },
      expires: '',
    }
    mockAuth.mockResolvedValue(session as never)
    const result = await requireAdmin()
    expect(result.error).toBeUndefined()
    expect(result.session).toBeDefined()
    expect(result.session?.user.role).toBe('admin')
  })
})

describe('requireAuth', () => {
  it('세션이 없으면 401 응답을 반환해야 한다', async () => {
    mockAuth.mockResolvedValue(null)
    const result = await requireAuth()
    expect(result.error).toBeDefined()
    expect(result.session).toBeUndefined()
  })

  it('로그인 상태면 세션을 반환해야 한다', async () => {
    const session = {
      user: { id: '1', role: 'user', name: 'test', email: 'a@b.com' },
      expires: '',
    }
    mockAuth.mockResolvedValue(session as never)
    const result = await requireAuth()
    expect(result.error).toBeUndefined()
    expect(result.session).toBeDefined()
  })
})

describe('parseId', () => {
  it('유효한 숫자 문자열을 파싱해야 한다', () => {
    const result = parseId('42')
    expect(result.id).toBe(42)
    expect(result.error).toBeUndefined()
  })

  it('유효하지 않은 문자열이면 에러를 반환해야 한다', () => {
    const result = parseId('abc')
    expect(result.id).toBeUndefined()
    expect(result.error).toBeDefined()
  })

  it('빈 문자열이면 에러를 반환해야 한다', () => {
    const result = parseId('')
    expect(result.id).toBeUndefined()
    expect(result.error).toBeDefined()
  })

  it('소수점 숫자는 정수 부분만 파싱해야 한다', () => {
    const result = parseId('3.14')
    expect(result.id).toBe(3)
    expect(result.error).toBeUndefined()
  })
})

describe('parsePagination', () => {
  it('기본값을 사용해야 한다', () => {
    const params = new URLSearchParams()
    const result = parsePagination(params)
    expect(result).toEqual({ page: 1, limit: 10, skip: 0 })
  })

  it('커스텀 page와 limit를 파싱해야 한다', () => {
    const params = new URLSearchParams({ page: '3', limit: '20' })
    const result = parsePagination(params)
    expect(result).toEqual({ page: 3, limit: 20, skip: 40 })
  })

  it('유효하지 않은 값이면 기본값을 사용해야 한다', () => {
    const params = new URLSearchParams({ page: 'abc', limit: '' })
    const result = parsePagination(params)
    expect(result).toEqual({ page: 1, limit: 10, skip: 0 })
  })
})

describe('verifyGuestPassword', () => {
  it('admin이면 비밀번호 없이 통과해야 한다', async () => {
    const result = await verifyGuestPassword(
      'hashedPw',
      'password123',
      { user: { role: 'admin' } } as never
    )
    expect(result).toBeNull()
  })

  it('비밀번호가 없으면 400 에러를 반환해야 한다', async () => {
    const result = await verifyGuestPassword('hashedPw', undefined, null)
    expect(result).toBeDefined()
    expect(result).toBeInstanceOf(NextResponse)
  })

  it('비밀번호가 틀리면 403 에러를 반환해야 한다', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
    const result = await verifyGuestPassword('hashedPw', 'wrong', null)
    expect(result).toBeDefined()
    expect(result).toBeInstanceOf(NextResponse)
  })

  it('비밀번호가 맞으면 null을 반환해야 한다', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
    const result = await verifyGuestPassword('hashedPw', 'correct', null)
    expect(result).toBeNull()
  })

  it('guestPassword가 null이면 500 에러를 반환해야 한다', async () => {
    const result = await verifyGuestPassword(null, 'password', null)
    expect(result).toBeDefined()
    expect(result).toBeInstanceOf(NextResponse)
  })
})

describe('formatZodError', () => {
  it('첫 번째 이슈 메시지를 반환해야 한다', () => {
    const mockError = {
      issues: [
        { message: '첫 번째 에러' },
        { message: '두 번째 에러' },
      ],
    }
    expect(formatZodError(mockError as never)).toBe('첫 번째 에러')
  })

  it('이슈가 없으면 기본 메시지를 반환해야 한다', () => {
    const mockError = { issues: [] }
    expect(formatZodError(mockError as never)).toBe('유효하지 않은 데이터입니다.')
  })
})
