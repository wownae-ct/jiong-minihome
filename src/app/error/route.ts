import { withMetrics } from '@/lib/metrics'

export const runtime = 'nodejs'

async function handler() {
  return Response.json(
    { error: 'Intentional 500 error for failure scenario demo' },
    { status: 500 },
  )
}

export const GET = withMetrics(handler, '/error')
