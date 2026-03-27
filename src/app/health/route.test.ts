import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('GET /health', () => {
  it('200 OK를 반환한다', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it('status, timestamp, uptime 필드를 포함한다', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body).toHaveProperty('status')
    expect(body).toHaveProperty('timestamp')
    expect(body).toHaveProperty('uptime')
  })

  it('status가 "ok"이다', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  it('uptime이 숫자형이다', async () => {
    const res = await GET()
    const body = await res.json()
    expect(typeof body.uptime).toBe('number')
  })

  it('timestamp가 ISO 8601 형식이다', async () => {
    const res = await GET()
    const body = await res.json()
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
  })
})
