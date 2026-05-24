import convert from 'heic-convert'

const HEIC_MIME_TYPES = [
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]

/**
 * 업로드된 파일이 HEIC/HEIF(아이폰 기본 사진 형식)인지 판별한다.
 * 일부 모바일 브라우저는 MIME 타입을 비워서(혹은 application/octet-stream으로) 전송하므로
 * 그 경우 파일 확장자로 한 번 더 판별한다.
 */
export function isHeicFile(type: string, filename: string): boolean {
  const normalizedType = (type || '').toLowerCase()

  if (HEIC_MIME_TYPES.includes(normalizedType)) {
    return true
  }

  if (!normalizedType || normalizedType === 'application/octet-stream') {
    return /\.(heic|heif)$/i.test(filename)
  }

  return false
}

/**
 * HEIC/HEIF 버퍼를 모든 브라우저에서 표시 가능한 JPEG 버퍼로 변환한다.
 * heic-convert는 순수 JS(libheif-js) 구현이라 네이티브 의존성 없이 Docker/Alpine에서도 동작한다.
 */
export async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const output = await convert({
    buffer: buffer as unknown as ArrayBufferLike,
    format: 'JPEG',
    quality: 0.9,
  })
  return Buffer.from(output)
}
