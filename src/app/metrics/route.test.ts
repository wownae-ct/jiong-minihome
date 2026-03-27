import { describe, it, expect, beforeEach } from 'vitest'

// 매 테스트마다 Registry 초기화
beforeEach(() => {
  delete (globalThis as Record<string, unknown>).__metricsRegistry
  delete (globalThis as Record<string, unknown>).__metricsInitialized
})

describe('GET /metrics', () => {
  it('200 OK를 반환한다', async () => {
    const { GET } = await import('./route')
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it('Content-Type이 text/plain을 포함한다', async () => {
    const { GET } = await import('./route')
    const res = await GET()
    expect(res.headers.get('content-type')).toContain('text/plain')
  })

  it('process_ 기본 메트릭을 포함한다', async () => {
    const { GET } = await import('./route')
    const res = await GET()
    const text = await res.text()
    expect(text).toContain('process_')
  })

  it('http_requests_total 커스텀 메트릭을 포함한다', async () => {
    const { GET } = await import('./route')
    const res = await GET()
    const text = await res.text()
    expect(text).toContain('http_requests_total')
  })

  it('http_request_duration_seconds 메트릭을 포함한다', async () => {
    const { GET } = await import('./route')
    const res = await GET()
    const text = await res.text()
    expect(text).toContain('http_request_duration_seconds')
  })
})
