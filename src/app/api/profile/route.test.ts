import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next-auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    siteSetting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { GET, PUT } from './route'
import { NextRequest } from 'next/server'

describe('Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/profile', () => {
    it('프로필 설정을 반환해야 함', async () => {
      const mockSettings = [
        { settingKey: 'profile_name', settingValue: '지옹' },
        { settingKey: 'profile_title', settingValue: 'Infrastructure Engineer' },
        { settingKey: 'profile_email', settingValue: 'test@example.com' },
        { settingKey: 'profile_github', settingValue: 'https://github.com/test' },
      ]

      vi.mocked(prisma.siteSetting.findMany).mockResolvedValue(
        mockSettings.map((s, i) => ({
          id: i + 1,
          settingKey: s.settingKey,
          settingValue: s.settingValue,
          description: null,
          updatedAt: new Date(),
        }))
      )

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('지옹')
      expect(data.title).toBe('Infrastructure Engineer')
      expect(data.email).toBe('test@example.com')
      expect(data.github).toBe('https://github.com/test')
    })

    it('설정이 없으면 기본값을 반환해야 함', async () => {
      vi.mocked(prisma.siteSetting.findMany).mockResolvedValue([])

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('')
      expect(data.title).toBe('')
    })
  })

  describe('PUT /api/profile', () => {
    it('관리자가 아니면 403을 반환해야 함', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', role: 'user' },
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: '테스트' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(403)
    })

    it('인증되지 않은 사용자는 401을 반환해야 함', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: '테스트' }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(401)
    })

    it('관리자는 프로필을 업데이트할 수 있어야 함', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', role: 'admin' },
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

      vi.mocked(prisma.siteSetting.upsert).mockImplementation(async (args) => ({
        id: 1,
        settingKey: args.where.settingKey,
        settingValue: args.update.settingValue as string,
        description: null,
        updatedAt: new Date(),
      }))

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: '지옹',
          title: 'Infrastructure Engineer',
          quote: '테스트 인용문',
          email: 'test@example.com',
          github: 'https://github.com/test',
          linkedin: 'https://linkedin.com/in/test',
          website: 'https://example.com',
          imageUrl: 'https://example.com/image.jpg',
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prisma.siteSetting.upsert).toHaveBeenCalledTimes(8)
    })

    it('유효하지 않은 데이터는 400을 반환해야 함', async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: '1', role: 'admin' },
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never)

      const request = new NextRequest('http://localhost/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          email: 'invalid-email',
        }),
      })

      const response = await PUT(request)
      expect(response.status).toBe(400)
    })
  })
})
