/**
 * @vitest-environment node
 */
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bgmTrack: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>()
  return {
    ...actual,
    unlink: vi.fn().mockResolvedValue(undefined),
  }
})

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { DELETE, PATCH } from './route'

const mockAuth = vi.mocked(auth)

function createParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('DELETE /api/bgm/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비로그인 사용자는 401 반환', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/bgm/1', { method: 'DELETE' })
    const response = await DELETE(request, createParams('1'))
    expect(response.status).toBe(401)
  })

  it('비관리자는 403 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'user' },
      expires: new Date().toISOString(),
    })

    const request = new NextRequest('http://localhost:3000/api/bgm/1', { method: 'DELETE' })
    const response = await DELETE(request, createParams('1'))
    expect(response.status).toBe(403)
  })

  it('존재하지 않는 트랙은 404 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })
    vi.mocked(prisma.bgmTrack.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/bgm/999', { method: 'DELETE' })
    const response = await DELETE(request, createParams('999'))
    expect(response.status).toBe(404)
  })

  it('트랙을 삭제하고 200 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    const mockTrack = { id: 1, title: '곡1', filename: 'uuid.mp3', url: '/uploads/uuid.mp3' }
    vi.mocked(prisma.bgmTrack.findUnique).mockResolvedValue(mockTrack as never)
    vi.mocked(prisma.bgmTrack.delete).mockResolvedValue(mockTrack as never)

    const request = new NextRequest('http://localhost:3000/api/bgm/1', { method: 'DELETE' })
    const response = await DELETE(request, createParams('1'))
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.success).toBe(true)

    expect(prisma.bgmTrack.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})

describe('PATCH /api/bgm/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비로그인 사용자는 401 반환', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/bgm/1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '새 제목' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(request, createParams('1'))
    expect(response.status).toBe(401)
  })

  it('비관리자는 403 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'user' },
      expires: new Date().toISOString(),
    })

    const request = new NextRequest('http://localhost:3000/api/bgm/1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '새 제목' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(request, createParams('1'))
    expect(response.status).toBe(403)
  })

  it('존재하지 않는 트랙은 404 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })
    vi.mocked(prisma.bgmTrack.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/bgm/999', {
      method: 'PATCH',
      body: JSON.stringify({ title: '새 제목' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(request, createParams('999'))
    expect(response.status).toBe(404)
  })

  it('제목을 업데이트할 수 있다', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    const existingTrack = { id: 1, title: '기존 제목', artist: null }
    const updatedTrack = { ...existingTrack, title: '새 제목' }
    vi.mocked(prisma.bgmTrack.findUnique).mockResolvedValue(existingTrack as never)
    vi.mocked(prisma.bgmTrack.update).mockResolvedValue(updatedTrack as never)

    const request = new NextRequest('http://localhost:3000/api/bgm/1', {
      method: 'PATCH',
      body: JSON.stringify({ title: '새 제목' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(request, createParams('1'))
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.title).toBe('새 제목')
  })

  it('isActive를 토글할 수 있다', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    const existingTrack = { id: 1, title: '곡1', isActive: true }
    const updatedTrack = { ...existingTrack, isActive: false }
    vi.mocked(prisma.bgmTrack.findUnique).mockResolvedValue(existingTrack as never)
    vi.mocked(prisma.bgmTrack.update).mockResolvedValue(updatedTrack as never)

    const request = new NextRequest('http://localhost:3000/api/bgm/1', {
      method: 'PATCH',
      body: JSON.stringify({ isActive: false }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(request, createParams('1'))
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.isActive).toBe(false)
  })
})
