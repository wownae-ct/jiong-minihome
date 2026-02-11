import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireAuth } from '@/lib/api/helpers'

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

    // 프로필 이미지는 모든 인증된 사용자 허용, 나머지는 admin만
    if (uploadType !== 'profile' && session.user.role !== 'admin') {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 })
    }

    const isAudioUpload = uploadType === 'bgm'
    const allowedTypes = isAudioUpload ? ALLOWED_AUDIO_TYPES : ALLOWED_IMAGE_TYPES
    const maxSize = isAudioUpload ? MAX_AUDIO_FILE_SIZE : MAX_IMAGE_FILE_SIZE
    const extensionMap = isAudioUpload ? AUDIO_EXTENSION_MAP : IMAGE_EXTENSION_MAP

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: isAudioUpload
          ? '오디오 파일만 업로드할 수 있습니다. (mp3, wav, ogg, m4a)'
          : '이미지 파일만 업로드할 수 있습니다. (jpg, jpeg, png, gif, webp)' },
        { status: 400 }
      )
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isAudioUpload
          ? '파일 크기는 15MB 이하여야 합니다.'
          : '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      )
    }

    // 파일 저장 디렉토리 생성
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    // 고유한 파일명 생성
    const extension = extensionMap[file.type] || '.jpg'
    const filename = `${randomUUID()}${extension}`
    const filepath = path.join(uploadDir, filename)

    // 파일 저장
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    // 클라이언트에서 접근 가능한 URL 반환
    const url = `/uploads/${filename}`

    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    console.error('파일 업로드 오류:', error)
    return NextResponse.json({ error: '파일 업로드에 실패했습니다.' }, { status: 500 })
  }
}
