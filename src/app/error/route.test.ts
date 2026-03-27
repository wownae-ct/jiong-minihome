import { describe, it, expect } from 'vitest'
import { GET } from './route'

const req = new Request('http://localhost/error')

describe('GET /error', () => {
  it('500 상태코드를 반환한다', async () => {
    const res = await GET(req)
    expect(res.status).toBe(500)
  })

  it('응답 body에 에러 메시지를 포함한다', async () => {
    const res = await GET(req)
    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toBeTruthy()
  })
})
