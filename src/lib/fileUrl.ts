/**
 * 비공개 MinIO 객체를 동일 출처 프록시(/api/files)로 서빙하기 위한 URL 변환 유틸.
 * SDK/서버 전용 env에 의존하지 않는 순수 함수라 클라이언트/서버 어디서나 사용 가능.
 */

// 동일 출처 프록시 경로 prefix
export const FILE_PROXY_PREFIX = '/api/files'

// MinIO 서비스 버킷 (CLAUDE.md: 서비스 단위 고정 버킷)
const BUCKET = 'portfolio-web'

// 프록시가 서빙하는 key prefix (이 둘만 허용 — 임의 객체 노출 방지)
export const ALLOWED_KEY_PREFIXES = ['uploads', 'bgm'] as const

/**
 * 저장된 값(절대 MinIO URL 또는 프록시 경로)에서 스토리지 key를 추출한다.
 * 외부 URL(OAuth 아바타 등)이나 허용되지 않은 prefix면 null.
 */
export function extractStorageKey(value: string | null | undefined): string | null {
  if (!value) return null

  let rest: string | null = null

  if (value.startsWith(`${FILE_PROXY_PREFIX}/`)) {
    rest = value.slice(FILE_PROXY_PREFIX.length + 1)
  } else {
    const marker = `/${BUCKET}/`
    const idx = value.indexOf(marker)
    if (idx !== -1) rest = value.slice(idx + marker.length)
  }

  if (!rest) return null

  // 쿼리스트링/프래그먼트 제거 (presigned 잔재 등)
  const key = rest.split('?')[0].split('#')[0]
  const prefix = key.split('/')[0]
  if (!(ALLOWED_KEY_PREFIXES as readonly string[]).includes(prefix)) return null

  return key
}

/**
 * 저장된 이미지/오디오 값을 동일 출처 프록시 경로로 변환한다.
 * - 이미 프록시 경로면 그대로
 * - 절대 MinIO URL이면 /api/files/<key>로 변환
 * - 그 외(외부 URL 등)는 변환하지 않고 그대로 반환
 */
export function toProxyPath(value: string | null | undefined): string {
  if (!value) return ''
  if (value.startsWith(`${FILE_PROXY_PREFIX}/`)) return value
  const key = extractStorageKey(value)
  return key ? `${FILE_PROXY_PREFIX}/${key}` : value
}

/**
 * 본문 HTML 안의 절대 MinIO URL(uploads/bgm)을 프록시 경로로 치환한다.
 * 기존에 저장된 게시글/포트폴리오 본문을 렌더 직전에 안전하게 변환하는 용도.
 */
export function rewriteStorageHtml(html: string): string {
  if (!html) return ''
  const re = new RegExp(
    `https?://[^\\s"'<>]+/${BUCKET}/((?:uploads|bgm)/[^\\s"'<>)]+)`,
    'g'
  )
  return html.replace(re, `${FILE_PROXY_PREFIX}/$1`)
}
