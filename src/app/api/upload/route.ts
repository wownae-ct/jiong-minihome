import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { requireAuth } from '@/lib/api/helpers'
import { uploadToS3 } from '@/lib/s3'
import { isHeicFile, convertHeicToJpeg } from '@/lib/heic'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const IMAGE_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
}

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4']
const MAX_AUDIO_FILE_SIZE = 15 * 1024 * 1024 // 15MB

const AUDIO_EXTENSION_MAP: Record<string, string> = {
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
}

export async function POST(request: NextRequest) {
  try {
    const { session, error: authError } = await requireAuth()
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadType = formData.get('type') as string | null

    // 프로필 이미지와 게시글 이미지는 모든 인증된 사용자 허용, 나머지는 admin만
    const userAllowedTypes = ['profile', 'post']
    if (!userAllowedTypes.includes(uploadType || '') && session.user.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    const isAudioUpload = uploadType === 'bgm'
    const allowedTypes = isAudioUpload ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES
    const maxSize = isAudioUpload ? MAX_AUDIO_FILE_SIZE : MAX_IMAGE_FILE_SIZE
    const extensionMap = isAudioUpload ? AUDIO_EXTENSION_MAP : IMAGE_EXTENSION_MAP

    // 아이폰 등 모바일 기본 사진 형식(HEIC/HEIF)은 변환 대상이므로 형식 검증을 통과시킨다.
    const isHeic = !isAudioUpload && isHeicFile(file.type, file.name)

    if (!isHeic && !allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: isAudioUpload
          ? '오디오 파일만 업로드할 수 있습니다. (mp3, wav, ogg, m4a)'
          : '이미지 파일만 업로드할 수 있습니다. (jpg, jpeg, png, gif, webp)' },
        { status: 400 }
      )
    }

    // 크기 검증은 변환 전 원본 기준으로 수행한다.
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isAudioUpload
          ? '파일 크기는 15MB 이하여야 합니다.'
          : '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      )
    }

    const sourceBuffer = Buffer.from(await file.arrayBuffer())

    // HEIC/HEIF → JPEG 변환 (모든 브라우저에서 표시 가능하도록)
    const buffer = isHeic ? await convertHeicToJpeg(sourceBuffer) : sourceBuffer
    const contentType = isHeic ? 'image/jpeg' : file.type
    const extension = isHeic ? '.jpg' : extensionMap[file.type] || '.jpg'

    // 고유한 파일명 생성 (prefix로 파일 유형 구분)
    const prefix = isAudioUpload ? 'bgm' : 'uploads'
    const key = `${prefix}/${randomUUID()}${extension}`

    // S3에 파일 업로드
    const url = await uploadToS3(buffer, key, contentType)

    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return NextResponse.json({ error: '파일 업로드에 실패했습니다.' }, { status: 500 })
  }
}
