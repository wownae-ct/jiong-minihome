/**
 * @vitest-environment node
 */
import type { JWT } from 'next-auth/jwt'
import type { Session } from 'next-auth'

vi.mock('./prisma', () => ({
  prisma: {},
}))

import { handleSessionCallback } from './auth-callbacks'

function makeSession(): Session {
  return { user: { id: '', email: 'a@b.c', name: 'A', role: 'user' }, expires: '' } as Session
}

describe('handleSessionCallback - 프로필 이미지 프록시 변환', () => {
  it('JWT에 캐시된 절대 MinIO URL을 /api/files 프록시 경로로 변환한다', async () => {
    const token = {
      id: '1',
      role: 'user',
      picture: 'https://s3.jiun2.ddns.net/portfolio-web/uploads/abc.jpg',
    } as unknown as JWT

    const result = await handleSessionCallback({ session: makeSession(), token })

    expect(result.user.image).toBe('/api/files/uploads/abc.jpg')
  })

  it('외부 OAuth 아바타(google)는 변환하지 않는다', async () => {
    const ext = 'https://lh3.googleusercontent.com/a/abc'
    const token = { id: '1', role: 'user', picture: ext } as unknown as JWT

    const result = await handleSessionCallback({ session: makeSession(), token })

    expect(result.user.image).toBe(ext)
  })

  it('이미 프록시 경로면 그대로 둔다', async () => {
    const token = { id: '1', role: 'user', picture: '/api/files/uploads/x.jpg' } as unknown as JWT

    const result = await handleSessionCallback({ session: makeSession(), token })

    expect(result.user.image).toBe('/api/files/uploads/x.jpg')
  })

  it('picture가 없으면 image는 undefined', async () => {
    const token = { id: '1', role: 'user' } as unknown as JWT

    const result = await handleSessionCallback({ session: makeSession(), token })

    expect(result.user.image).toBeUndefined()
  })

  it('id와 role도 토큰에서 매핑한다', async () => {
    const token = { id: '42', role: 'admin', picture: '' } as unknown as JWT

    const result = await handleSessionCallback({ session: makeSession(), token })

    expect(result.user.id).toBe('42')
    expect(result.user.role).toBe('admin')
  })
})
