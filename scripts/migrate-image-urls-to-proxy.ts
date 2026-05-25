/**
 * DB에 저장된 절대 MinIO URL을 동일 출처 프록시 경로(/api/files/<key>)로 일괄 변환한다.
 *
 * 배경: 버킷을 비공개로 전환하면서 이미지를 앱 프록시로 서빙하도록 변경(getPublicUrl).
 *       기존 레코드는 절대 MinIO URL이라 비공개 버킷에서 403이 나므로 한 번 변환해 준다.
 *
 * 사용법:
 *   미리보기: npx tsx scripts/migrate-image-urls-to-proxy.ts --dry-run
 *   실행:     npx tsx scripts/migrate-image-urls-to-proxy.ts
 *
 * 멱등성: 이미 프록시 경로(/api/files/...)거나 외부 URL(OAuth 아바타 등)은 그대로 둔다.
 *         여러 번 실행해도 안전하다. (앱 코드와 동일한 변환 로직 재사용 → DRY)
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { toProxyPath, rewriteStorageHtml } from '../src/lib/fileUrl'

const prisma = new PrismaClient()
const DRY_RUN = process.argv.includes('--dry-run')

interface FieldResult {
  label: string
  scanned: number
  changed: number
}

// 단일 URL 필드(프로필 이미지/대표 이미지/오디오/첨부 경로) 변환
async function migrateUrlField<T extends { id: number }>(
  label: string,
  rows: T[],
  getValue: (r: T) => string | null,
  update: (id: number, value: string) => Promise<unknown>,
): Promise<FieldResult> {
  let changed = 0
  for (const row of rows) {
    const current = getValue(row)
    if (!current) continue
    const next = toProxyPath(current)
    if (next !== current) {
      console.log(`  [${label}] #${row.id}: ${current} → ${next}`)
      if (!DRY_RUN) await update(row.id, next)
      changed++
    }
  }
  return { label, scanned: rows.length, changed }
}

// 본문 HTML 필드(게시글/포트폴리오/댓글/방명록/다이어리) 내 임베드 URL 변환
async function migrateHtmlField<T extends { id: number }>(
  label: string,
  rows: T[],
  getValue: (r: T) => string | null,
  update: (id: number, value: string) => Promise<unknown>,
): Promise<FieldResult> {
  let changed = 0
  for (const row of rows) {
    const current = getValue(row)
    if (!current) continue
    const next = rewriteStorageHtml(current)
    if (next !== current) {
      console.log(`  [${label}] #${row.id} 본문 이미지 URL 치환`)
      if (!DRY_RUN) await update(row.id, next)
      changed++
    }
  }
  return { label, scanned: rows.length, changed }
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN (변경 없음) ===' : '=== 마이그레이션 실행 ===')

  const results: FieldResult[] = []

  // --- 단일 URL 필드 ---
  results.push(
    await migrateUrlField(
      'User.profileImage',
      await prisma.user.findMany({ select: { id: true, profileImage: true } }),
      (r) => r.profileImage,
      (id, value) => prisma.user.update({ where: { id }, data: { profileImage: value } }),
    ),
  )

  results.push(
    await migrateUrlField(
      'Portfolio.image',
      await prisma.portfolio.findMany({ select: { id: true, image: true } }),
      (r) => r.image,
      (id, value) => prisma.portfolio.update({ where: { id }, data: { image: value } }),
    ),
  )

  results.push(
    await migrateUrlField(
      'BgmTrack.url',
      await prisma.bgmTrack.findMany({ select: { id: true, url: true } }),
      (r) => r.url,
      (id, value) => prisma.bgmTrack.update({ where: { id }, data: { url: value } }),
    ),
  )

  results.push(
    await migrateUrlField(
      'Attachment.filePath',
      await prisma.attachment.findMany({ select: { id: true, filePath: true } }),
      (r) => r.filePath,
      (id, value) => prisma.attachment.update({ where: { id }, data: { filePath: value } }),
    ),
  )

  // --- 본문 HTML 필드 ---
  results.push(
    await migrateHtmlField(
      'Post.content',
      await prisma.post.findMany({ select: { id: true, content: true } }),
      (r) => r.content,
      (id, value) => prisma.post.update({ where: { id }, data: { content: value } }),
    ),
  )

  results.push(
    await migrateHtmlField(
      'Portfolio.content',
      await prisma.portfolio.findMany({ select: { id: true, content: true } }),
      (r) => r.content,
      (id, value) => prisma.portfolio.update({ where: { id }, data: { content: value } }),
    ),
  )

  results.push(
    await migrateHtmlField(
      'Comment.content',
      await prisma.comment.findMany({ select: { id: true, content: true } }),
      (r) => r.content,
      (id, value) => prisma.comment.update({ where: { id }, data: { content: value } }),
    ),
  )

  results.push(
    await migrateHtmlField(
      'DiaryEntry.content',
      await prisma.diaryEntry.findMany({ select: { id: true, content: true } }),
      (r) => r.content,
      (id, value) => prisma.diaryEntry.update({ where: { id }, data: { content: value } }),
    ),
  )

  results.push(
    await migrateHtmlField(
      'GuestbookEntry.content',
      await prisma.guestbookEntry.findMany({ select: { id: true, content: true } }),
      (r) => r.content,
      (id, value) => prisma.guestbookEntry.update({ where: { id }, data: { content: value } }),
    ),
  )

  console.log('\n=== 요약 ===')
  let total = 0
  for (const r of results) {
    console.log(`  ${r.label}: ${r.scanned}건 스캔, ${r.changed}건 ${DRY_RUN ? '변경 예정' : '변경'}`)
    total += r.changed
  }
  console.log(`총 ${total}건 ${DRY_RUN ? '변경 예정' : '변경 완료'}`)
  if (DRY_RUN) console.log('\n실제 적용하려면 --dry-run 없이 다시 실행하세요.')
}

main()
  .catch((e) => {
    console.error('마이그레이션 실패:', e)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
