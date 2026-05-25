/**
 * @vitest-environment node
 */
import { NextRequest } from 'next/server'
import { GET } from './route'

vi.mock('@/lib/s3', () => ({
  getObject: vi.fn(),
}))

import { getObject } from '@/lib/s3'

const mockGetObject = vi.mocked(getObject)

function makeBody(text: string) {
  return {
    transformToWebStream: () =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(text))
          controller.close()
        },
      }),
  }
}

function req(url: string, headers?: Record<string, string>) {
  return new NextRequest(url, { headers })
}

describe('GET /api/files/[...key]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('허용된 uploads 객체를 200으로 스트리밍한다', async () => {
    mockGetObject.mockResolvedValue({
      Body: makeBody('img-bytes'),
      ContentType: 'image/jpeg',
      ContentLength: 9,
    } as never)

    const res = await GET(req('http://localhost/api/files/uploads/a.jpg'), {
      params: Promise.resolve({ key: ['uploads', 'a.jpg'] }),
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/jpeg')
    expect(res.headers.get('Accept-Ranges')).toBe('bytes')
    expect(res.headers.get('Cache-Control')).toContain('max-age')
    expect(mockGetObject).toHaveBeenCalledWith('uploads/a.jpg', undefined)
    expect(await res.text()).toBe('img-bytes')
  })

  it('Range 요청 시 206 + Content-Range를 반환한다 (BGM 시킹)', async () => {
    mockGetObject.mockResolvedValue({
      Body: makeBody('par'),
      ContentType: 'audio/mpeg',
      ContentRange: 'bytes 0-2/100',
      ContentLength: 3,
    } as never)

    const res = await GET(
      req('http://localhost/api/files/bgm/song.mp3', { range: 'bytes=0-2' }),
      { params: Promise.resolve({ key: ['bgm', 'song.mp3'] }) },
    )

    expect(res.status).toBe(206)
    expect(res.headers.get('Content-Range')).toBe('bytes 0-2/100')
    expect(mockGetObject).toHaveBeenCalledWith('bgm/song.mp3', 'bytes=0-2')
  })

  it('허용되지 않은 prefix는 404 (MinIO 접근 안 함)', async () => {
    const res = await GET(req('http://localhost/api/files/secret/x.jpg'), {
      params: Promise.resolve({ key: ['secret', 'x.jpg'] }),
    })

    expect(res.status).toBe(404)
    expect(mockGetObject).not.toHaveBeenCalled()
  })

  it('디렉터리 트래버설(..)은 404', async () => {
    const res = await GET(req('http://localhost/api/files/uploads/../etc'), {
      params: Promise.resolve({ key: ['uploads', '..', 'etc'] }),
    })

    expect(res.status).toBe(404)
    expect(mockGetObject).not.toHaveBeenCalled()
  })

  it('빈 key는 404', async () => {
    const res = await GET(req('http://localhost/api/files/'), {
      params: Promise.resolve({ key: [] }),
    })

    expect(res.status).toBe(404)
    expect(mockGetObject).not.toHaveBeenCalled()
  })

  it('존재하지 않는 key(NoSuchKey)는 404', async () => {
    mockGetObject.mockRejectedValue({ name: 'NoSuchKey' })

    const res = await GET(req('http://localhost/api/files/uploads/missing.jpg'), {
      params: Promise.resolve({ key: ['uploads', 'missing.jpg'] }),
    })

    expect(res.status).toBe(404)
  })
})
