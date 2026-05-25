/**
 * @vitest-environment node
 */
import { toProxyPath, rewriteStorageHtml, extractStorageKey, FILE_PROXY_PREFIX } from './fileUrl'

describe('toProxyPath', () => {
  it('절대 MinIO URL(uploads)을 프록시 경로로 변환', () => {
    expect(toProxyPath('https://s3.jiun2.ddns.net/portfolio-web/uploads/abc.jpg')).toBe(
      '/api/files/uploads/abc.jpg'
    )
  })

  it('절대 MinIO URL(bgm)을 프록시 경로로 변환', () => {
    expect(toProxyPath('http://jiun2.ddns.net:29000/portfolio-web/bgm/song.mp3')).toBe(
      '/api/files/bgm/song.mp3'
    )
  })

  it('이미 프록시 경로면 그대로 둔다', () => {
    expect(toProxyPath('/api/files/uploads/abc.jpg')).toBe('/api/files/uploads/abc.jpg')
  })

  it('외부 OAuth 아바타 URL은 변환하지 않는다', () => {
    const ext = 'https://lh3.googleusercontent.com/a/abc123'
    expect(toProxyPath(ext)).toBe(ext)
  })

  it('쿼리스트링(presigned 잔재)은 제거한다', () => {
    expect(
      toProxyPath('https://s3.jiun2.ddns.net/portfolio-web/uploads/abc.jpg?X-Amz-Signature=xyz')
    ).toBe('/api/files/uploads/abc.jpg')
  })

  it('허용되지 않은 prefix는 변환하지 않는다', () => {
    const other = 'https://s3.jiun2.ddns.net/portfolio-web/secret/abc.jpg'
    expect(toProxyPath(other)).toBe(other)
  })

  it('빈 값/null은 빈 문자열', () => {
    expect(toProxyPath('')).toBe('')
    expect(toProxyPath(null)).toBe('')
    expect(toProxyPath(undefined)).toBe('')
  })
})

describe('extractStorageKey', () => {
  it('프록시 경로에서 key 추출', () => {
    expect(extractStorageKey('/api/files/uploads/abc.jpg')).toBe('uploads/abc.jpg')
  })

  it('절대 MinIO URL에서 key 추출', () => {
    expect(extractStorageKey('https://s3.jiun2.ddns.net/portfolio-web/bgm/song.mp3')).toBe(
      'bgm/song.mp3'
    )
  })

  it('외부 URL은 null', () => {
    expect(extractStorageKey('https://lh3.googleusercontent.com/a/abc')).toBeNull()
  })

  it('허용되지 않은 prefix는 null', () => {
    expect(extractStorageKey('/api/files/secret/abc.jpg')).toBeNull()
  })
})

describe('rewriteStorageHtml', () => {
  it('본문 img의 절대 MinIO URL을 프록시 경로로 치환', () => {
    const html = '<p>hi</p><img src="https://s3.jiun2.ddns.net/portfolio-web/uploads/a.jpg">'
    expect(rewriteStorageHtml(html)).toContain('src="/api/files/uploads/a.jpg"')
    expect(rewriteStorageHtml(html)).not.toContain('s3.jiun2.ddns.net')
  })

  it('여러 이미지를 모두 치환', () => {
    const html =
      '<img src="https://s3.x/portfolio-web/uploads/a.jpg"><img src="https://s3.x/portfolio-web/uploads/b.png">'
    const out = rewriteStorageHtml(html)
    expect(out).toContain('/api/files/uploads/a.jpg')
    expect(out).toContain('/api/files/uploads/b.png')
  })

  it('외부 이미지는 건드리지 않는다', () => {
    const html = '<img src="https://images.unsplash.com/photo-1">'
    expect(rewriteStorageHtml(html)).toBe(html)
  })

  it('빈 값은 빈 문자열', () => {
    expect(rewriteStorageHtml('')).toBe('')
  })
})

describe('FILE_PROXY_PREFIX', () => {
  it('상대 경로 prefix', () => {
    expect(FILE_PROXY_PREFIX).toBe('/api/files')
  })
})
