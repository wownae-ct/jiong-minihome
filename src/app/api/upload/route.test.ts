/**
 * @vitest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock fs/promises
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>()
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  }
})

import { auth } from '@/lib/auth'

const mockAuth = vi.mocked(auth)

describe('/api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비로그인 사용자는 401 반환', async () => {
    mockAuth.mockResolvedValue(null)

    const formData = new FormData()
    formData.append('file', new Blob(['test'], { type: 'image/png' }), 'test.png')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('로그인이 필요합니다.')
  })

  it('관리자가 아닌 사용자는 type 없이 업로드 시 403 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'user' },
      expires: new Date().toISOString(),
    })

    const formData = new FormData()
    formData.append('file', new Blob(['test'], { type: 'image/png' }), 'test.png')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(403)

    const data = await response.json()
    expect(data.error).toBe('관리자 권한이 필요합니다.')
  })

  it('일반 유저가 type=profile로 프로필 이미지를 업로드하면 성공', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '2', role: 'user' },
      expires: new Date().toISOString(),
    })

    const formData = new FormData()
    formData.append('file', new Blob(['profile image'], { type: 'image/png' }), 'avatar.png')
    formData.append('type', 'profile')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.url).toMatch(/^\/uploads\//)
    expect(data.url).toMatch(/\.png$/)
  })

  it('파일이 없으면 400 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    const formData = new FormData()

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('파일이 필요합니다.')
  })

  it('허용되지 않은 파일 형식은 400 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    const formData = new FormData()
    formData.append('file', new Blob(['test'], { type: 'application/pdf' }), 'test.pdf')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('이미지 파일만 업로드할 수 있습니다. (jpg, jpeg, png, gif, webp)')
  })

  it('파일 크기가 5MB 초과시 400 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    // 6MB 크기의 가짜 파일 생성
    const largeContent = new Uint8Array(6 * 1024 * 1024)
    const formData = new FormData()
    formData.append('file', new Blob([largeContent], { type: 'image/png' }), 'large.png')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toBe('파일 크기는 5MB 이하여야 합니다.')
  })

  it('관리자가 유효한 이미지를 업로드하면 성공', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    const formData = new FormData()
    formData.append('file', new Blob(['test image content'], { type: 'image/png' }), 'test.png')

    const request = new NextRequest('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const data = await response.json()
    expect(data.url).toBeDefined()
    expect(data.url).toMatch(/^\/uploads\//)
    expect(data.url).toMatch(/\.png$/)
  })

  it('다양한 이미지 형식 업로드 허용 (jpeg, gif, webp)', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', role: 'admin' },
      expires: new Date().toISOString(),
    })

    const formats = [
      { type: 'image/jpeg', ext: '.jpg' },
      { type: 'image/gif', ext: '.gif' },
      { type: 'image/webp', ext: '.webp' },
    ]

    for (const format of formats) {
      const formData = new FormData()
      formData.append('file', new Blob(['test'], { type: format.type }), `test${format.ext}`)

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.url).toBeDefined()
    }
  })

  describe('BGM 오디오 업로드', () => {
    it('관리자가 type=bgm으로 mp3 파일을 업로드하면 성공', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['audio content'], { type: 'audio/mpeg' }), 'song.mp3')
      formData.append('type', 'bgm')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.url).toMatch(/^\/uploads\//)
      expect(data.url).toMatch(/\.mp3$/)
    })

    it('다양한 오디오 형식 업로드 허용 (wav, ogg, m4a)', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const formats = [
        { type: 'audio/wav', ext: '.wav' },
        { type: 'audio/ogg', ext: '.ogg' },
        { type: 'audio/mp4', ext: '.m4a' },
      ]

      for (const format of formats) {
        const formData = new FormData()
        formData.append('file', new Blob(['audio'], { type: format.type }), `test${format.ext}`)
        formData.append('type', 'bgm')

        const request = new NextRequest('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData,
        })

        const response = await POST(request)
        expect(response.status).toBe(201)

        const data = await response.json()
        expect(data.url).toMatch(new RegExp(`\\${format.ext}$`))
      }
    })

    it('비관리자는 type=bgm 업로드 시 403 반환', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '2', role: 'user' },
        expires: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['audio'], { type: 'audio/mpeg' }), 'song.mp3')
      formData.append('type', 'bgm')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(403)
    })

    it('type=bgm일 때 이미지 파일은 400 반환', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['image'], { type: 'image/png' }), 'test.png')
      formData.append('type', 'bgm')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('오디오')
    })

    it('오디오 파일 크기가 15MB 초과시 400 반환', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const largeContent = new Uint8Array(16 * 1024 * 1024)
      const formData = new FormData()
      formData.append('file', new Blob([largeContent], { type: 'audio/mpeg' }), 'large.mp3')
      formData.append('type', 'bgm')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('15MB')
    })

    it('type=bgm이 아닌 경우 오디오 파일은 기존 이미지 검증으로 400 반환', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['audio'], { type: 'audio/mpeg' }), 'song.mp3')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('이미지')
    })
  })
})
