import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAuth } from '@/lib/api/helpers'
import { createPresignedUploadUrl, getPublicUrl } from '@/lib/s3'

const ALLOWED_MEDIA_TYPES: Record<string, string> = {
  // 이미지
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  // 비디오
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const { contentType, fileSize } = body

    if (!contentType || !ALLOWED_MEDIA_TYPES[contentType]) {
      return NextResponse.json(
        { error: '허용되지 않는 파일 형식입니다. (jpg, png, gif, webp, mp4, webm, mov)' },
        { status: 400 },
      )
    }

    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 50MB 이하여야 합니다.' },
        { status: 400 },
      )
    }

    const extension = ALLOWED_MEDIA_TYPES[contentType]
    const key = `uploads/${randomUUID()}${extension}`

    const presignedUrl = await createPresignedUploadUrl(key, contentType)
    const publicUrl = getPublicUrl(key)

    return NextResponse.json({ presignedUrl, key, publicUrl }, { status: 200 })
  } catch (error) {
    console.error('Presigned URL 생성 오류:', error)
    return NextResponse.json(
      { error: 'Presigned URL 생성에 실패했습니다.' },
      { status: 500 },
    )
  }
}
