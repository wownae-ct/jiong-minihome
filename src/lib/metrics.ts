import client from 'prom-client'

// globalThis 싱글톤으로 Registry 관리 (Next.js HMR 대응)
const globalForMetrics = globalThis as typeof globalThis & {
  __metricsRegistry?: client.Registry
  __metricsInitialized?: boolean
}

export const registry = globalForMetrics.__metricsRegistry ?? new client.Registry()
globalForMetrics.__metricsRegistry = registry

if (!globalForMetrics.__metricsInitialized) {
  client.collectDefaultMetrics({ register: registry })
  globalForMetrics.__metricsInitialized = true
}

// --- 커스텀 메트릭 ---

function getOrCreateMetric<T extends client.Metric>(
  name: string,
  factory: () => T,
): T {
  const existing = registry.getSingleMetric(name)
  if (existing) return existing as T
  return factory()
}

export const httpRequestsTotal = getOrCreateMetric(
  'http_requests_total',
  () =>
    new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'] as const,
      registers: [registry],
    }),
)

export const httpRequestDuration = getOrCreateMetric(
  'http_request_duration_seconds',
  () =>
    new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'] as const,
      buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
      registers: [registry],
    }),
)

export const http5xxTotal = getOrCreateMetric(
  'http_requests_5xx_total',
  () =>
    new client.Counter({
      name: 'http_requests_5xx_total',
      help: 'Total number of 5xx HTTP responses',
      labelNames: ['method', 'route'] as const,
      registers: [registry],
    }),
)

// --- withMetrics 래퍼 ---

type Handler = (req: Request) => Promise<Response>

export function withMetrics(handler: Handler, route: string): Handler {
  return async (req: Request) => {
    const start = performance.now()
    const res = await handler(req)
    const duration = (performance.now() - start) / 1000
    const method = req.method
    const statusCode = String(res.status)

    httpRequestsTotal.inc({ method, route, status_code: statusCode })
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration)

    if (res.status >= 500) {
      http5xxTotal.inc({ method, route })
    }

    return res
  }
}
