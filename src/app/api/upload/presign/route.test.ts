/**
 * @vitest-environment node
 */
import { NextRequest } from 'next/server'
import { POST } from './route'

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/s3', () => ({
  createPresignedUploadUrl: vi.fn().mockResolvedValue('https://minio.example.com/presigned'),
  getPublicUrl: vi.fn().mockImplementation((key: string) =>
    `http://minio.example.com:9000/portfolio-web/${key}`,
  ),
}))

import { auth } from '@/lib/auth'

const mockAuth = vi.mocked(auth)

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('/api/upload/presign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('비로그인 사용자는 401 반환', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await POST(makeRequest({ contentType: 'video/mp4' }))
    expect(res.status).toBe(401)
  })

  it('허용되지 않는 contentType은 400 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user' },
      expires: '',
    } as never)

    const res = await POST(makeRequest({ contentType: 'application/pdf' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('허용되지 않는')
  })

  it('파일 크기 초과 시 400 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user' },
      expires: '',
    } as never)

    const res = await POST(makeRequest({
      contentType: 'video/mp4',
      fileSize: 60 * 1024 * 1024, // 60MB
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('50MB')
  })

  it('비디오 파일에 대해 presigned URL 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user' },
      expires: '',
    } as never)

    const res = await POST(makeRequest({ contentType: 'video/mp4' }))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.presignedUrl).toBe('https://minio.example.com/presigned')
    expect(body.key).toMatch(/^uploads\/[\w-]+\.mp4$/)
    expect(body.publicUrl).toContain('portfolio-web')
  })

  it('이미지 파일에 대해 presigned URL 반환', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user' },
      expires: '',
    } as never)

    const res = await POST(makeRequest({ contentType: 'image/png' }))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.key).toMatch(/^uploads\/[\w-]+\.png$/)
  })

  it('webm 비디오도 허용해야 함', async () => {
    mockAuth.mockResolvedValue({
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'user' },
      expires: '',
    } as never)

    const res = await POST(makeRequest({ contentType: 'video/webm' }))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.key).toMatch(/\.webm$/)
  })
})
