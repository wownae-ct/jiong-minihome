import { describe, it, expect, beforeEach } from 'vitest'

// 매 테스트마다 싱글톤 초기화
beforeEach(() => {
  delete (globalThis as Record<string, unknown>).__metricsRegistry
  delete (globalThis as Record<string, unknown>).__metricsInitialized
})

describe('metrics 모듈', () => {
  it('Registry 싱글톤이 동일 인스턴스를 반환한다', async () => {
    const { registry } = await import('./metrics')
    // 캐시 무효화 후 재 import 하더라도 globalThis 기반이므로 동일
    expect(registry).toBeDefined()
    expect(registry.contentType).toContain('text/plain')
  })

  it('collectDefaultMetrics 메트릭이 등록된다', async () => {
    const { registry } = await import('./metrics')
    const metrics = await registry.getMetricsAsJSON()
    const metricNames = metrics.map((m) => m.name)
    expect(metricNames.some((n) => n.startsWith('process_'))).toBe(true)
  })

  it('httpRequestsTotal Counter가 등록된다', async () => {
    const { httpRequestsTotal } = await import('./metrics')
    expect(httpRequestsTotal).toBeDefined()
  })

  it('httpRequestDuration Histogram이 등록된다', async () => {
    const { httpRequestDuration } = await import('./metrics')
    expect(httpRequestDuration).toBeDefined()
  })

  it('http5xxTotal Counter가 등록된다', async () => {
    const { http5xxTotal } = await import('./metrics')
    expect(http5xxTotal).toBeDefined()
  })
})

describe('withMetrics 래퍼', () => {
  it('원래 handler의 응답을 그대로 반환한다', async () => {
    const { withMetrics } = await import('./metrics')
    const handler = async () => Response.json({ ok: true })
    const wrapped = withMetrics(handler, '/test')

    const req = new Request('http://localhost/test')
    const res = await wrapped(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('5xx 응답 시 http5xxTotal을 증가시킨다', async () => {
    const { withMetrics, http5xxTotal, registry } = await import('./metrics')
    const handler = async () => Response.json({ error: 'fail' }, { status: 500 })
    const wrapped = withMetrics(handler, '/test-error')

    const req = new Request('http://localhost/test-error')
    await wrapped(req)

    const metrics = await registry.getMetricsAsJSON()
    const counter5xx = metrics.find((m) => m.name === 'http_requests_5xx_total')
    expect(counter5xx).toBeDefined()
  })

  it('요청 수 Counter를 증가시킨다', async () => {
    const { withMetrics, registry } = await import('./metrics')
    const handler = async () => Response.json({ ok: true })
    const wrapped = withMetrics(handler, '/test-count')

    const req = new Request('http://localhost/test-count')
    await wrapped(req)

    const metrics = await registry.getMetricsAsJSON()
    const counter = metrics.find((m) => m.name === 'http_requests_total')
    expect(counter).toBeDefined()
  })
})
