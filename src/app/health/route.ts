export const runtime = 'nodejs'

export async function GET() {
  return Response.json({
    status: 'broken',
    message: 'forced failure for phase8 rollback test',
  }, { status: 500 })
}
