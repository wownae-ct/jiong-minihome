import { NextRequest } from 'next/server'
import { getObject } from '@/lib/s3'
import { ALLOWED_KEY_PREFIXES } from '@/lib/fileUrl'

type RouteParams = { params: Promise<{ key: string[] }> }

const NOT_FOUND = () => new Response('Not Found', { status: 404 })

/**
 * 비공개 MinIO 객체 프록시. 버킷을 공개하지 않고 앱 서버 자격증명으로 객체를 읽어 중계한다.
 * - 허용 prefix(uploads/bgm)만 서빙, 디렉터리 트래버설 차단
 * - Range 요청 전달 → 부분 응답(206)으로 오디오/동영상 시킹 지원
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { key: segments } = await params

  // 보안: 허용 prefix만, 빈 경로/트래버설/널바이트 차단
  const prefix = segments[0]
  if (
    segments.length < 2 ||
    !(ALLOWED_KEY_PREFIXES as readonly string[]).includes(prefix) ||
    segments.some((s) => s === '..' || s === '.' || s.includes('\0') || s.length === 0)
  ) {
    return NOT_FOUND()
  }

  const key = segments.join('/')
  const range = request.headers.get('range') ?? undefined

  try {
    const obj = await getObject(key, range)
    const body = obj.Body as { transformToWebStream?: () => ReadableStream } | undefined
    if (!body) return NOT_FOUND()

    const stream = body.transformToWebStream
      ? body.transformToWebStream()
      : (body as unknown as ReadableStream)

    const headers = new Headers()
    if (obj.ContentType) headers.set('Content-Type', obj.ContentType)
    if (obj.ContentLength != null) headers.set('Content-Length', String(obj.ContentLength))
    headers.set('Accept-Ranges', 'bytes')
    if (obj.ContentRange) headers.set('Content-Range', obj.ContentRange)
    if (obj.ETag) headers.set('ETag', obj.ETag)
    if (obj.LastModified) headers.set('Last-Modified', obj.LastModified.toUTCString())
    // key가 uuid 기반 불변 자산이므로 장기 캐시
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')

    const status = range && obj.ContentRange ? 206 : 200
    return new Response(stream, { status, headers })
  } catch (err) {
    const code =
      (err as { name?: string; Code?: string })?.name ??
      (err as { Code?: string })?.Code
    const httpStatus = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata
      ?.httpStatusCode
    // 없는 객체는 404로 처리. MinIO는 ListBucket 권한이 없으면 없는 키에 대해
    // NoSuchKey(404) 대신 AccessDenied(403)를 돌려주므로 둘 다 not-found로 본다.
    if (
      code === 'NoSuchKey' ||
      code === 'NotFound' ||
      code === 'AccessDenied' ||
      httpStatus === 404 ||
      httpStatus === 403
    ) {
      return NOT_FOUND()
    }
    console.error(`파일 프록시 오류 (key=${key}, code=${code}):`, err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
