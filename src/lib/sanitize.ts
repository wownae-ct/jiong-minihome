import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  // 인라인 텍스트
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'span', 'a', 'mark', 'sub', 'sup',
  // 헤딩
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // 리스트
  'ul', 'ol', 'li',
  // 블록
  'blockquote', 'pre', 'code', 'div', 'hr',
  // 미디어
  'img', 'video', 'source', 'iframe',
  // 테이블 (추후 확장용)
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
]

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class',
  'target', 'rel', 'width', 'height',
  'style', 'controls', 'autoplay', 'muted', 'loop', 'playsinline',
  'allowfullscreen', 'frameborder',
  'data-youtube-video', 'type',
  'colspan', 'rowspan',
]

export function sanitizeHtml(html: string): string {
  if (!html) return ''

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allowfullscreen', 'frameborder', 'controls'],
  })
}

/**
 * 문자열에 HTML 태그가 포함되어 있는지 판별
 * 기존 plain text 게시글과 새 HTML 게시글을 구분하기 위해 사용
 */
export function isHtmlContent(content: string): boolean {
  return /<[a-z][\s\S]*?>/i.test(content)
}
