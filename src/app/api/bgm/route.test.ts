/**
 * @vitest-environment node
 */
import { NextRequest } from 'next/server'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bgmTrack: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { GET, POST } from './route'

const mockAuth = vi.mocked(auth)

describe('GET /api/bgm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.bgmTrack.findMany).mockResolvedValue([])
  })

  it('활성 트랙만 조회한다', async () => {
    const request = new NextRequest('http://localhost:3000/api/bgm')
    await GET(request)

    expect(prisma.bgmTrack.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  })

  it('all=true일 때 모든 트랙을 조회한다', async () => {
    const request = new NextRequest('http://localhost:3000/api/bgm?all=true')
    await GET(request)

    expect(prisma.bgmTrack.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  })

  it('트랙이 없으면 빈 배열을 반환한다', async () => {
    const request = new NextRequest('http://localhost:3000/api/bgm')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual([])
  })

  it('트랙 목록을 정상적으로 반환한다', async () => {
    const mockTracks = [
      { id: 1, title: '곡1', artist: '아티스트1', url: '/uploads/song1.mp3', duration: 180, isActive: true, sortOrder: 0 },
      { id: 2, title: '곡2', artist: null, url: '/uploads/song2.mp3', duration: 240, isActive: true, sortOrder: 1 },
    ]
    vi.mocked(prisma.bgmTrack.findMany).mockResolvedValue(mockTracks as never)

    const request = new NextRequest('http://localhost:3000/api/bgm')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(2)
    expect(data[0].title).toBe('곡1')
  })
})

describe('POST /api/bgm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비로그인 사용자는 401 반환', async () => {
    mockAuth.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/bgm', {
      method: 'POST',
      body: JSON.stringify({ title: '곡' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('비관리자는 403 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'user' },
      expires: new Date().toISOString(),
    })

    const request = new NextRequest('http://localhost:3000/api/bgm', {
      method: 'POST',
      body: JSON.stringify({ title: '곡', url: '/uploads/test.mp3', originalName: 'test.mp3', filename: 'uuid.mp3' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(403)
  })

  it('필수 필드 누락 시 400 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    const request = new NextRequest('http://localhost:3000/api/bgm', {
      method: 'POST',
      body: JSON.stringify({ artist: '아티스트만' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('유효한 데이터로 트랙을 생성한다', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    const trackData = {
      title: '바람, 어디에서 부는지',
      artist: 'Lucid Fall',
      url: '/uploads/uuid-song.mp3',
      originalName: 'song.mp3',
      filename: 'uuid-song.mp3',
      fileSize: 5000000,
      duration: 222,
    }

    const createdTrack = { id: 1, ...trackData, sortOrder: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() }
    vi.mocked(prisma.bgmTrack.create).mockResolvedValue(createdTrack as never)

    const request = new NextRequest('http://localhost:3000/api/bgm', {
      method: 'POST',
      body: JSON.stringify(trackData),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.title).toBe('바람, 어디에서 부는지')
    expect(data.artist).toBe('Lucid Fall')

    expect(prisma.bgmTrack.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: '바람, 어디에서 부는지',
        artist: 'Lucid Fall',
        url: '/uploads/uuid-song.mp3',
        originalName: 'song.mp3',
        filename: 'uuid-song.mp3',
      }),
    })
  })
})
