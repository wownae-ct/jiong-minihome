import { sanitizeHtml, isHtmlContent } from './sanitize'

describe('sanitizeHtml', () => {
  it('기본 HTML 태그를 허용해야 함', () => {
    const html = '<p>Hello <strong>World</strong></p>'
    expect(sanitizeHtml(html)).toBe('<p>Hello <strong>World</strong></p>')
  })

  it('헤딩 태그를 허용해야 함', () => {
    const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>'
    expect(sanitizeHtml(html)).toContain('<h1>')
    expect(sanitizeHtml(html)).toContain('<h2>')
    expect(sanitizeHtml(html)).toContain('<h3>')
  })

  it('리스트 태그를 허용해야 함', () => {
    const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
    expect(sanitizeHtml(html)).toContain('<ul>')
    expect(sanitizeHtml(html)).toContain('<li>')
  })

  it('이미지 태그의 src, alt를 허용해야 함', () => {
    const html = '<img src="https://example.com/img.jpg" alt="test">'
    const result = sanitizeHtml(html)
    expect(result).toContain('src="https://example.com/img.jpg"')
    expect(result).toContain('alt="test"')
  })

  it('비디오 태그를 허용해야 함', () => {
    const html = '<video controls><source src="https://example.com/video.mp4"></video>'
    const result = sanitizeHtml(html)
    expect(result).toContain('<video')
    expect(result).toContain('controls')
  })

  it('iframe (YouTube 임베드)을 허용해야 함', () => {
    const html = '<iframe src="https://www.youtube.com/embed/abc123" width="640" height="360"></iframe>'
    const result = sanitizeHtml(html)
    expect(result).toContain('<iframe')
    expect(result).toContain('youtube.com')
  })

  it('인라인 스타일 중 color, font-size를 허용해야 함', () => {
    const html = '<span style="color: red; font-size: 20px;">styled</span>'
    const result = sanitizeHtml(html)
    expect(result).toContain('color')
    expect(result).toContain('font-size')
  })

  it('script 태그를 제거해야 함', () => {
    const html = '<p>Hello</p><script>alert("XSS")</script>'
    const result = sanitizeHtml(html)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).toContain('<p>Hello</p>')
  })

  it('onerror 이벤트 핸들러를 제거해야 함', () => {
    const html = '<img src="x" onerror="alert(1)">'
    const result = sanitizeHtml(html)
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
  })

  it('onclick 이벤트 핸들러를 제거해야 함', () => {
    const html = '<button onclick="alert(1)">Click</button>'
    const result = sanitizeHtml(html)
    expect(result).not.toContain('onclick')
  })

  it('javascript: URL을 제거해야 함', () => {
    const html = '<a href="javascript:alert(1)">Click</a>'
    const result = sanitizeHtml(html)
    expect(result).not.toContain('javascript:')
  })

  it('data: URL (스크립트)을 제거해야 함', () => {
    const html = '<a href="data:text/html,<script>alert(1)</script>">Click</a>'
    const result = sanitizeHtml(html)
    expect(result).not.toContain('data:text/html')
  })

  it('빈 문자열은 빈 문자열을 반환해야 함', () => {
    expect(sanitizeHtml('')).toBe('')
  })

  it('blockquote를 허용해야 함', () => {
    const html = '<blockquote><p>인용문</p></blockquote>'
    expect(sanitizeHtml(html)).toContain('<blockquote>')
  })

  it('code/pre 태그를 허용해야 함', () => {
    const html = '<pre><code>const x = 1;</code></pre>'
    const result = sanitizeHtml(html)
    expect(result).toContain('<pre>')
    expect(result).toContain('<code>')
  })

  it('a 태그의 href, target, rel을 허용해야 함', () => {
    const html = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>'
    const result = sanitizeHtml(html)
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('target="_blank"')
  })
})

describe('isHtmlContent', () => {
  it('HTML 태그가 포함된 문자열은 true를 반환해야 함', () => {
    expect(isHtmlContent('<p>Hello</p>')).toBe(true)
    expect(isHtmlContent('<strong>bold</strong>')).toBe(true)
    expect(isHtmlContent('<img src="test.jpg">')).toBe(true)
  })

  it('HTML 태그가 없는 문자열은 false를 반환해야 함', () => {
    expect(isHtmlContent('Hello World')).toBe(false)
    expect(isHtmlContent('This is plain text')).toBe(false)
    expect(isHtmlContent('')).toBe(false)
  })

  it('꺾쇠 기호만 있는 문자열은 false를 반환해야 함', () => {
    expect(isHtmlContent('3 < 5 and 7 > 2')).toBe(false)
  })
})
