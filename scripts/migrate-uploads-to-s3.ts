/**
 * 기존 로컬 uploads 파일을 MinIO S3로 마이그레이션하는 스크립트
 *
 * 사용법:
 *   npx tsx scripts/migrate-uploads-to-s3.ts
 *
 * 동작:
 *   1. public/uploads/ 디렉토리의 모든 파일을 MinIO에 업로드
 *   2. DB 레코드의 /uploads/... 경로를 전체 MinIO URL로 업데이트
 *
 * 멱등성: 이미 전체 URL인 레코드는 건너뜁니다.
 */
import 'dotenv/config'
import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return MIME_MAP[ext] || 'application/octet-stream'
}

const REQUIRED_ENV = [
  'MINIO_ENDPOINT',
  'MINIO_PUBLIC_URL',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_BUCKET',
]

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`환경변수 ${key}가 설정되지 않았습니다.`)
    process.exit(1)
  }
}

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
})

const BUCKET = process.env.MINIO_BUCKET!
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL!.replace(/\/$/, '')
const prisma = new PrismaClient()

function buildPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${BUCKET}/${key}`
}

function replaceUploadsInHtml(html: string): string {
  // /uploads/filename 패턴을 전체 MinIO URL로 치환 (uploads/ prefix 포함)
  return html.replace(
    /(["'(])\/uploads\/([^"')\s]+)/g,
    (_match, prefix: string, filename: string) => `${prefix}${buildPublicUrl(`uploads/${filename}`)}`,
  )
}

async function migrateFiles(): Promise<number> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

  let files: string[]
  try {
    files = await readdir(uploadsDir)
  } catch {
    console.log('public/uploads 디렉토리가 없습니다. 파일 마이그레이션을 건너뜁니다.')
    return 0
  }

  let uploaded = 0
  for (const filename of files) {
    const filepath = path.join(uploadsDir, filename)
    const buffer = await readFile(filepath)
    const contentType = getMimeType(filename)
    const prefix = contentType.startsWith('audio/') ? 'bgm' : 'uploads'
    const key = `${prefix}/${filename}`

    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        }),
      )
      uploaded++
      console.log(`  업로드 완료: ${filename}`)
    } catch (error) {
      console.error(`  업로드 실패: ${filename}`, error)
    }
  }

  return uploaded
}

async function migrateDbRecords(): Promise<void> {
  const OLD_PREFIX = '/uploads/'

  // 1. users.profile_image
  const usersResult = await prisma.$executeRawUnsafe(
    `UPDATE users SET profile_image = CONCAT(?, profile_image)
     WHERE profile_image LIKE '/uploads/%'`,
    `${PUBLIC_URL}/${BUCKET}`,
  )
  console.log(`  users.profile_image: ${usersResult}건 업데이트`)

  // 2. portfolios.image
  const portfoliosImageResult = await prisma.$executeRawUnsafe(
    `UPDATE portfolios SET image = CONCAT(?, image)
     WHERE image LIKE '/uploads/%'`,
    `${PUBLIC_URL}/${BUCKET}`,
  )
  console.log(`  portfolios.image: ${portfoliosImageResult}건 업데이트`)

  // 3. bgm_tracks.url (/uploads/file.mp3 → {PUBLIC_URL}/{BUCKET}/bgm/file.mp3)
  const bgmResult = await prisma.$executeRawUnsafe(
    `UPDATE bgm_tracks SET url = REPLACE(url, '/uploads/', ?)
     WHERE url LIKE '/uploads/%'`,
    `${PUBLIC_URL}/${BUCKET}/bgm/`,
  )
  console.log(`  bgm_tracks.url: ${bgmResult}건 업데이트`)

  // 4. site_settings (profile_image 키)
  const siteSettingsResult = await prisma.$executeRawUnsafe(
    `UPDATE site_settings SET setting_value = CONCAT(?, setting_value)
     WHERE setting_key = 'profile_image' AND setting_value LIKE '/uploads/%'`,
    `${PUBLIC_URL}/${BUCKET}`,
  )
  console.log(`  site_settings (profile_image): ${siteSettingsResult}건 업데이트`)

  // 5. attachments.file_path
  const attachmentsResult = await prisma.$executeRawUnsafe(
    `UPDATE attachments SET file_path = CONCAT(?, file_path)
     WHERE file_path LIKE '/uploads/%'`,
    `${PUBLIC_URL}/${BUCKET}`,
  )
  console.log(`  attachments.file_path: ${attachmentsResult}건 업데이트`)

  // 6. posts.content (HTML 내 이미지 경로)
  const posts = await prisma.post.findMany({
    where: { content: { contains: OLD_PREFIX } },
    select: { id: true, content: true },
  })
  for (const post of posts) {
    const updated = replaceUploadsInHtml(post.content)
    await prisma.post.update({
      where: { id: post.id },
      data: { content: updated },
    })
  }
  console.log(`  posts.content: ${posts.length}건 업데이트`)

  // 7. diary_entries.content (HTML 내 이미지 경로)
  const diaryEntries = await prisma.diaryEntry.findMany({
    where: { content: { contains: OLD_PREFIX } },
    select: { id: true, content: true },
  })
  for (const entry of diaryEntries) {
    const updated = replaceUploadsInHtml(entry.content)
    await prisma.diaryEntry.update({
      where: { id: entry.id },
      data: { content: updated },
    })
  }
  console.log(`  diary_entries.content: ${diaryEntries.length}건 업데이트`)

  // 8. portfolios.content (HTML 내 이미지 경로)
  const portfolios = await prisma.portfolio.findMany({
    where: { content: { contains: OLD_PREFIX } },
    select: { id: true, content: true },
  })
  for (const portfolio of portfolios) {
    const updated = replaceUploadsInHtml(portfolio.content)
    await prisma.portfolio.update({
      where: { id: portfolio.id },
      data: { content: updated },
    })
  }
  console.log(`  portfolios.content: ${portfolios.length}건 업데이트`)
}

async function main() {
  console.log('=== MinIO S3 마이그레이션 시작 ===')
  console.log(`MinIO 엔드포인트: ${process.env.MINIO_ENDPOINT}`)
  console.log(`공개 URL: ${PUBLIC_URL}`)
  console.log(`버킷: ${BUCKET}`)
  console.log()

  console.log('[1/2] 파일 업로드...')
  const uploadedCount = await migrateFiles()
  console.log(`  총 ${uploadedCount}개 파일 업로드 완료`)
  console.log()

  console.log('[2/2] DB 레코드 업데이트...')
  await migrateDbRecords()
  console.log()

  console.log('=== 마이그레이션 완료 ===')

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error('마이그레이션 실패:', error)
  await prisma.$disconnect()
  process.exit(1)
})
