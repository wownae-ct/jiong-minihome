/**
 * @vitest-environment node
 * 프로필 API 통합 테스트
 * - DB 저장/조회 일관성
 * - 유효성 검증
 * - 관리자 권한
 * - 파일 업로드 연동
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock next-auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma with in-memory storage
const mockDatabase: Record<string, { id: number; settingKey: string; settingValue: string; description: string | null; updatedAt: Date }> = {}
let idCounter = 1

vi.mock('@/lib/prisma', () => ({
  prisma: {
    siteSetting: {
      findMany: vi.fn().mockImplementation(async ({ where }) => {
        if (where?.settingKey?.in) {
          return Object.values(mockDatabase).filter(item =>
            where.settingKey.in.includes(item.settingKey)
          )
        }
        return Object.values(mockDatabase)
      }),
      upsert: vi.fn().mockImplementation(async ({ where, update, create }) => {
        const existing = mockDatabase[where.settingKey]
        if (existing) {
          mockDatabase[where.settingKey] = {
            ...existing,
            settingValue: update.settingValue,
            updatedAt: new Date(),
          }
          return mockDatabase[where.settingKey]
        } else {
          mockDatabase[where.settingKey] = {
            id: idCounter++,
            settingKey: create.settingKey,
            settingValue: create.settingValue,
            description: create.description || null,
            updatedAt: new Date(),
          }
          return mockDatabase[where.settingKey]
        }
      }),
    },
  },
}))

// Mock fs/promises for upload
vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>()
  return {
    ...actual,
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  }
})

import { auth } from '@/lib/auth'
import { GET, PUT } from './route'
import { POST as uploadPost } from '../upload/route'

const mockAuth = vi.mocked(auth)

describe('프로필 설정 통합 테스트', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock database
    Object.keys(mockDatabase).forEach(key => delete mockDatabase[key])
    idCounter = 1
  })

  describe('1. DB 저장/조회 일관성 테스트', () => {
    it('저장한 프로필 데이터가 조회 시 동일하게 반환되어야 함', async () => {
      // 관리자로 인증
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const profileData = {
        name: '지옹',
        title: 'Infrastructure Engineer',
        quote: '클라우드와 함께하는 여정',
        email: 'jiong@example.com',
        github: 'https://github.com/jiong',
        linkedin: 'https://linkedin.com/in/jiong',
        website: 'https://jiong.dev',
        imageUrl: '/uploads/profile-123.png',
      }

      // 1. 프로필 저장
      const putRequest = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })

      const putResponse = await PUT(putRequest)
      expect(putResponse.status).toBe(200)

      // 2. 프로필 조회
      const getResponse = await GET()
      const retrievedData = await getResponse.json()

      // 3. 저장한 데이터와 조회한 데이터 비교
      expect(retrievedData.name).toBe(profileData.name)
      expect(retrievedData.title).toBe(profileData.title)
      expect(retrievedData.quote).toBe(profileData.quote)
      expect(retrievedData.email).toBe(profileData.email)
      expect(retrievedData.github).toBe(profileData.github)
      expect(retrievedData.linkedin).toBe(profileData.linkedin)
      expect(retrievedData.website).toBe(profileData.website)
      expect(retrievedData.imageUrl).toBe(profileData.imageUrl)
    })

    it('부분 업데이트 시 기존 데이터가 유지되어야 함', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      // 1. 초기 데이터 저장
      const initialData = {
        name: '지옹',
        title: 'Engineer',
        email: 'jiong@example.com',
      }

      await PUT(new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify(initialData),
      }))

      // 2. 이름만 업데이트
      await PUT(new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: '지옹 업데이트' }),
      }))

      // 3. 조회
      const getResponse = await GET()
      const data = await getResponse.json()

      // 4. 이름은 변경되고, 나머지는 유지되어야 함
      expect(data.name).toBe('지옹 업데이트')
      expect(data.title).toBe('Engineer')
      expect(data.email).toBe('jiong@example.com')
    })

    it('빈 문자열로 업데이트해도 정상 저장되어야 함', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      // 1. 초기 데이터 저장
      await PUT(new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: '지옹', github: 'https://github.com/jiong' }),
      }))

      // 2. github를 빈 문자열로 업데이트
      await PUT(new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ github: '' }),
      }))

      // 3. 조회
      const getResponse = await GET()
      const data = await getResponse.json()

      expect(data.name).toBe('지옹')
      expect(data.github).toBe('')
    })
  })

  describe('2. 유효성 검증 테스트', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })
    })

    it('이름이 100자를 초과하면 400 에러 반환', async () => {
      const longName = 'a'.repeat(101)

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: longName }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('유효하지 않은 데이터입니다.')
    })

    it('직함이 200자를 초과하면 400 에러 반환', async () => {
      const longTitle = 'a'.repeat(201)

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ title: longTitle }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(400)
    })

    it('인용문이 500자를 초과하면 400 에러 반환', async () => {
      const longQuote = 'a'.repeat(501)

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ quote: longQuote }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(400)
    })

    it('유효하지 않은 이메일 형식이면 400 에러 반환', async () => {
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ email: 'invalid-email-format' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.details?.fieldErrors?.email).toBeDefined()
    })

    it('유효하지 않은 URL 형식이면 400 에러 반환 (github)', async () => {
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ github: 'not-a-url' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(400)
    })

    it('유효하지 않은 URL 형식이면 400 에러 반환 (linkedin)', async () => {
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ linkedin: 'not-a-url' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(400)
    })

    it('유효하지 않은 URL 형식이면 400 에러 반환 (website)', async () => {
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ website: 'not-a-url' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(400)
    })

    it('유효한 데이터는 정상 저장되어야 함', async () => {
      const validData = {
        name: '지옹',
        title: 'Infrastructure Engineer',
        quote: '클라우드와 함께',
        email: 'jiong@example.com',
        github: 'https://github.com/jiong',
        linkedin: 'https://linkedin.com/in/jiong',
        website: 'https://jiong.dev',
      }

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify(validData),
      })

      const response = await PUT(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
    })

    it('빈 문자열 이메일은 허용되어야 함', async () => {
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ email: '' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(200)
    })

    it('빈 문자열 URL은 허용되어야 함', async () => {
      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          github: '',
          linkedin: '',
          website: ''
        }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(200)
    })
  })

  describe('3. 관리자 권한 테스트', () => {
    it('비로그인 사용자는 프로필 수정 불가 (401)', async () => {
      mockAuth.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: '해커' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(401)

      const data = await response.json()
      expect(data.error).toBe('로그인이 필요합니다.')
    })

    it('일반 사용자는 프로필 수정 불가 (403)', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '2', role: 'user' },
        expires: new Date().toISOString(),
      })

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: '일반사용자' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(403)

      const data = await response.json()
      expect(data.error).toBe('관리자 권한이 필요합니다.')
    })

    it('관리자는 프로필 수정 가능 (200)', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: '관리자' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(200)
    })

    it('프로필 조회는 누구나 가능', async () => {
      // 인증 없이 조회
      mockAuth.mockResolvedValue(null)

      const response = await GET()
      expect(response.status).toBe(200)
    })
  })

  describe('4. 파일 업로드 연동 테스트', () => {
    it('관리자가 이미지 파일을 업로드하면 URL이 반환됨', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['fake image data'], { type: 'image/png' }), 'profile.png')

      const uploadRequest = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadResponse = await uploadPost(uploadRequest)
      expect(uploadResponse.status).toBe(201)

      const uploadData = await uploadResponse.json()
      expect(uploadData.url).toBeDefined()
      expect(uploadData.url).toMatch(/^\/uploads\//)
      expect(uploadData.url).toMatch(/\.png$/)
    })

    it('업로드된 이미지 URL을 프로필에 저장할 수 있음', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      // 1. 이미지 업로드
      const formData = new FormData()
      formData.append('file', new Blob(['fake image data'], { type: 'image/jpeg' }), 'avatar.jpg')

      const uploadRequest = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const uploadResponse = await uploadPost(uploadRequest)
      const uploadData = await uploadResponse.json()

      // 2. 업로드된 URL을 프로필에 저장
      const profileRequest = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ imageUrl: uploadData.url }),
      })

      const profileResponse = await PUT(profileRequest)
      expect(profileResponse.status).toBe(200)

      // 3. 프로필 조회하여 확인
      const getResponse = await GET()
      const profileData = await getResponse.json()

      expect(profileData.imageUrl).toBe(uploadData.url)
    })

    it('비관리자는 이미지 업로드 불가 (403)', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '2', role: 'user' },
        expires: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['fake'], { type: 'image/png' }), 'test.png')

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await uploadPost(request)
      expect(response.status).toBe(403)
    })

    it('허용되지 않은 파일 형식은 업로드 불가 (400)', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const formData = new FormData()
      formData.append('file', new Blob(['malicious'], { type: 'application/javascript' }), 'malware.js')

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await uploadPost(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('이미지 파일만')
    })

    it('5MB 초과 파일은 업로드 불가 (400)', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      // 6MB 파일 생성
      const largeContent = new Uint8Array(6 * 1024 * 1024)
      const formData = new FormData()
      formData.append('file', new Blob([largeContent], { type: 'image/png' }), 'large.png')

      const request = new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: formData,
      })

      const response = await uploadPost(request)
      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('5MB')
    })

    it('다양한 이미지 형식 업로드 가능 (jpg, png, gif, webp)', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      const formats = [
        { type: 'image/jpeg', name: 'test.jpg' },
        { type: 'image/png', name: 'test.png' },
        { type: 'image/gif', name: 'test.gif' },
        { type: 'image/webp', name: 'test.webp' },
      ]

      for (const format of formats) {
        const formData = new FormData()
        formData.append('file', new Blob(['data'], { type: format.type }), format.name)

        const request = new NextRequest('http://localhost/api/upload', {
          method: 'POST',
          body: formData,
        })

        const response = await uploadPost(request)
        expect(response.status).toBe(201)
      }
    })
  })

  describe('5. 전체 플로우 테스트', () => {
    it('관리자가 프로필 이미지를 업로드하고 프로필을 설정하는 전체 과정', async () => {
      mockAuth.mockResolvedValue({
        user: { id: '1', role: 'admin' },
        expires: new Date().toISOString(),
      })

      // 1. 프로필 이미지 업로드
      const imageData = new FormData()
      imageData.append('file', new Blob(['profile photo'], { type: 'image/png' }), 'jiong-avatar.png')

      const uploadResponse = await uploadPost(new NextRequest('http://localhost/api/upload', {
        method: 'POST',
        body: imageData,
      }))

      expect(uploadResponse.status).toBe(201)
      const { url: imageUrl } = await uploadResponse.json()

      // 2. 프로필 정보 저장 (업로드된 이미지 URL 포함)
      const profileData = {
        name: '지옹',
        title: 'Senior Infrastructure Engineer',
        quote: '클라우드 인프라의 세계로 여러분을 초대합니다',
        email: 'jiong@example.com',
        github: 'https://github.com/jiong',
        linkedin: 'https://linkedin.com/in/jiong',
        website: 'https://jiong.dev',
        imageUrl: imageUrl,
      }

      const putResponse = await PUT(new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }))

      expect(putResponse.status).toBe(200)

      // 3. 저장된 프로필 조회
      const getResponse = await GET()
      const savedProfile = await getResponse.json()

      // 4. 모든 데이터가 일치하는지 확인
      expect(savedProfile.name).toBe(profileData.name)
      expect(savedProfile.title).toBe(profileData.title)
      expect(savedProfile.quote).toBe(profileData.quote)
      expect(savedProfile.email).toBe(profileData.email)
      expect(savedProfile.github).toBe(profileData.github)
      expect(savedProfile.linkedin).toBe(profileData.linkedin)
      expect(savedProfile.website).toBe(profileData.website)
      expect(savedProfile.imageUrl).toBe(imageUrl)
      expect(savedProfile.imageUrl).toMatch(/^\/uploads\//)
    })
  })
})
