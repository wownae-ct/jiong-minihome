/**
 * @vitest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock S3
vi.mock('@/lib/s3', () => ({
  uploadToS3: vi.fn().mockImplementation((_buffer: Buffer, key: string) =>
    Promise.resolve(`http://minio.example.com:9000/portfolio-web/${key}`)
  ),
}))

// Mock HEIC 변환 (실제 변환은 heic.test.ts에서 검증, 여기선 라우트 흐름만 검증)
vi.mock('@/lib/heic', () => ({
  isHeicFile: vi.fn(
    (type: string, name: string) =>
      type === 'image/heic' || type === 'image/heif' || /\.(heic|heif)$/i.test(name)
  ),
  convertHeicToJpeg: vi.fn().mockResolvedValue(Buffer.from('converted-jpeg')),
}))

import { auth } from '@/lib/auth'
import { uploadToS3 } from '@/lib/s3'
import { convertHeicToJpeg } from '@/lib/heic'

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
    expect(data.url).toMatch(/^http:\/\/minio\.example\.com:9000\/portfolio-web\/uploads\//)
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
    expect(data.url).toMatch(/^http:\/\/minio\.example\.com:9000\/portfolio-web\/uploads\//)
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

  describe('HEIC(아이폰) 이미지 업로드', () => {
    it('image/heic 사진을 업로드하면 JPEG로 변환되어 성공', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '2', role: 'user' },
        expires: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['heic-bytes'], { type: 'image/heic' }), 'IMG_0001.heic')
      formData.append('type', 'post')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.url).toMatch(/\.jpg$/)
      expect(convertHeicToJpeg).toHaveBeenCalledOnce()
      // 변환된 버퍼가 image/jpeg 콘텐츠 타입으로 업로드되어야 함
      expect(uploadToS3).toHaveBeenCalledWith(expect.any(Buffer), expect.any(String), 'image/jpeg')
    })

    it('type이 비어있어도 .heic 확장자면 변환되어 성공', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['heic-bytes'], { type: '' }), 'photo.heic')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.url).toMatch(/\.jpg$/)
      expect(convertHeicToJpeg).toHaveBeenCalledOnce()
    })

    it('HEIC 원본이 5MB를 초과하면 400 반환 (변환 전 차단)', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const largeContent = new Uint8Array(6 * 1024 * 1024)
      const formData = new FormData()
      formData.append('file', new Blob([largeContent], { type: 'image/heic' }), 'large.heic')

      const request = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      expect(convertHeicToJpeg).not.toHaveBeenCalled()
    })
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
      expect(data.url).toMatch(/^http:\/\/minio\.example\.com:9000\/portfolio-web\/bgm\//)
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
