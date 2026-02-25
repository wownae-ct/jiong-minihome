import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn().mockResolvedValue({})

const MockPutObjectCommand = vi.fn()
const MockDeleteObjectCommand = vi.fn()
const mockGetSignedUrl = vi.fn().mockResolvedValue('https://minio.example.com:9000/presigned-url')

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class MockS3Client {
      send = mockSend
    },
    PutObjectCommand: class {
      constructor(params: unknown) {
        MockPutObjectCommand(params)
        Object.assign(this, params)
      }
    },
    DeleteObjectCommand: class {
      constructor(params: unknown) {
        MockDeleteObjectCommand(params)
        Object.assign(this, params)
      }
    },
  }
})

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}))

describe('S3 유틸리티', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.stubEnv('MINIO_ENDPOINT', 'http://minio.example.com:9000')
    vi.stubEnv('MINIO_PUBLIC_URL', 'http://minio.example.com:9000')
    vi.stubEnv('MINIO_ACCESS_KEY', 'test-access-key')
    vi.stubEnv('MINIO_SECRET_KEY', 'test-secret-key')
    vi.stubEnv('MINIO_BUCKET', 'portfolio-web')
    vi.stubEnv('MINIO_REGION', 'us-east-1')
  })

  describe('uploadToS3', () => {
    it('PutObjectCommand를 올바른 파라미터로 호출해야 한다', async () => {
      const { uploadToS3 } = await import('./s3')

      const buffer = Buffer.from('test-image-data')
      const key = 'test-uuid.jpg'
      const contentType = 'image/jpeg'

      await uploadToS3(buffer, key, contentType)

      expect(MockPutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'portfolio-web',
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
      expect(mockSend).toHaveBeenCalledOnce()
    })

    it('올바른 공개 URL을 반환해야 한다', async () => {
      const { uploadToS3 } = await import('./s3')

      const url = await uploadToS3(Buffer.from('data'), 'uploads/photo.png', 'image/png')

      expect(url).toBe('http://minio.example.com:9000/portfolio-web/uploads/photo.png')
    })
  })

  describe('deleteFromS3', () => {
    it('DeleteObjectCommand를 올바른 파라미터로 호출해야 한다', async () => {
      const { deleteFromS3 } = await import('./s3')

      await deleteFromS3('test-uuid.mp3')

      expect(MockDeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'portfolio-web',
        Key: 'test-uuid.mp3',
      })
      expect(mockSend).toHaveBeenCalledOnce()
    })
  })

  describe('getPublicUrl', () => {
    it('올바른 공개 URL을 조합해야 한다', async () => {
      const { getPublicUrl } = await import('./s3')

      expect(getPublicUrl('uploads/photo.jpg')).toBe('http://minio.example.com:9000/portfolio-web/uploads/photo.jpg')
    })

    it('bgm prefix가 포함된 key도 올바르게 처리해야 한다', async () => {
      const { getPublicUrl } = await import('./s3')

      expect(getPublicUrl('bgm/song.mp3')).toBe('http://minio.example.com:9000/portfolio-web/bgm/song.mp3')
    })

    it('MINIO_PUBLIC_URL의 trailing slash를 처리해야 한다', async () => {
      vi.stubEnv('MINIO_PUBLIC_URL', 'http://minio.example.com:9000/')
      const { getPublicUrl } = await import('./s3')

      expect(getPublicUrl('uploads/photo.jpg')).toBe('http://minio.example.com:9000/portfolio-web/uploads/photo.jpg')
    })
  })

  describe('extractKeyFromUrl', () => {
    it('전체 MinIO URL에서 S3 key를 추출해야 한다', async () => {
      const { extractKeyFromUrl } = await import('./s3')

      const key = extractKeyFromUrl('http://minio.example.com:9000/portfolio-web/uploads/test-uuid.jpg')

      expect(key).toBe('uploads/test-uuid.jpg')
    })

    it('bgm prefix가 포함된 URL에서 key를 추출해야 한다', async () => {
      const { extractKeyFromUrl } = await import('./s3')

      const key = extractKeyFromUrl('http://minio.example.com:9000/portfolio-web/bgm/test-uuid.mp3')

      expect(key).toBe('bgm/test-uuid.mp3')
    })

    it('관련 없는 URL에 대해 null을 반환해야 한다', async () => {
      const { extractKeyFromUrl } = await import('./s3')

      expect(extractKeyFromUrl('https://other-domain.com/file.jpg')).toBeNull()
    })

    it('기존 로컬 경로(/uploads/...)에 대해 null을 반환해야 한다', async () => {
      const { extractKeyFromUrl } = await import('./s3')

      expect(extractKeyFromUrl('/uploads/old-file.jpg')).toBeNull()
    })

    it('빈 문자열에 대해 null을 반환해야 한다', async () => {
      const { extractKeyFromUrl } = await import('./s3')

      expect(extractKeyFromUrl('')).toBeNull()
    })
  })

  describe('createPresignedUploadUrl', () => {
    it('presigned URL을 반환해야 한다', async () => {
      const { createPresignedUploadUrl } = await import('./s3')

      const url = await createPresignedUploadUrl('uploads/test.mp4', 'video/mp4')

      expect(url).toBe('https://minio.example.com:9000/presigned-url')
      expect(MockPutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'portfolio-web',
        Key: 'uploads/test.mp4',
        ContentType: 'video/mp4',
      })
    })

    it('기본 만료 시간은 300초여야 한다', async () => {
      const { createPresignedUploadUrl } = await import('./s3')

      await createPresignedUploadUrl('uploads/test.mp4', 'video/mp4')

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 300 }
      )
    })

    it('커스텀 만료 시간을 설정할 수 있어야 한다', async () => {
      const { createPresignedUploadUrl } = await import('./s3')

      await createPresignedUploadUrl('uploads/test.mp4', 'video/mp4', 600)

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 600 }
      )
    })
  })
})
