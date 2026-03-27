import { registry } from '@/lib/metrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const metrics = await registry.metrics()
  return new Response(metrics, {
    headers: { 'content-type': registry.contentType },
  })
}
