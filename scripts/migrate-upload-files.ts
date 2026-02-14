/**
 * [단계 1] 로컬 uploads 파일을 MinIO S3로 업로드 (DB 수정 없음)
 *
 * 실행: npx tsx scripts/migrate-upload-files.ts
 *
 * 동작:
 *   - public/uploads/ 디렉토리의 모든 파일을 MinIO에 업로드
 *   - 오디오 파일 → bgm/ prefix, 이미지 파일 → uploads/ prefix
 *   - 업로드 후 DB 업데이트용 SQL문을 출력
 */
import * as dotenv from 'dotenv'
import * as path from 'path'
import { readdir, readFile, stat } from 'fs/promises'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

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

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.m4a'])

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  return MIME_MAP[ext] || 'application/octet-stream'
}

function isAudioFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return AUDIO_EXTENSIONS.has(ext)
}

const REQUIRED_ENV = ['MINIO_ENDPOINT', 'MINIO_PUBLIC_URL', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY', 'MINIO_BUCKET']
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`ERROR: 환경변수 ${key}가 설정되지 않았습니다.`)
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

async function main() {
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads')

  console.log('=== MinIO S3 파일 업로드 (단계 1) ===\n')
  console.log(`소스: ${uploadsDir}`)
  console.log(`대상: ${process.env.MINIO_ENDPOINT}/${BUCKET}`)
  console.log(`공개 URL: ${PUBLIC_URL}/${BUCKET}`)
  console.log('')

  let files: string[]
  try {
    files = await readdir(uploadsDir)
  } catch {
    console.error('ERROR: public/uploads 디렉토리를 찾을 수 없습니다.')
    process.exit(1)
  }

  // 테스트 파일 제외 (100 bytes 미만)
  const realFiles: string[] = []
  const skippedFiles: string[] = []
  for (const filename of files) {
    const filepath = path.join(uploadsDir, filename)
    const fileStat = await stat(filepath)
    if (fileStat.size < 100) {
      skippedFiles.push(`${filename} (${fileStat.size} bytes)`)
    } else {
      realFiles.push(filename)
    }
  }

  if (skippedFiles.length > 0) {
    console.log(`테스트 파일 ${skippedFiles.length}개 건너뜀 (100 bytes 미만):`)
    for (const f of skippedFiles) {
      console.log(`  - ${f}`)
    }
    console.log('')
  }

  console.log(`업로드 대상: ${realFiles.length}개 파일\n`)

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const filename of realFiles) {
    const filepath = path.join(uploadsDir, filename)
    const contentType = getMimeType(filename)
    const prefix = isAudioFile(filename) ? 'bgm' : 'uploads'
    const key = `${prefix}/${filename}`

    // 이미 존재하는지 확인
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
      console.log(`  [건너뜀] ${key} (이미 존재)`)
      skipped++
      continue
    } catch {
      // 존재하지 않음 → 업로드 진행
    }

    try {
      const buffer = await readFile(filepath)
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }))
      console.log(`  [완료] ${key} (${contentType})`)
      uploaded++
    } catch (error) {
      console.error(`  [실패] ${key}:`, error)
      failed++
    }
  }

  console.log('')
  console.log(`=== 결과: 업로드 ${uploaded}, 건너뜀 ${skipped}, 실패 ${failed} ===`)
  console.log('')

  if (failed > 0) {
    console.error('일부 파일 업로드에 실패했습니다. 실패한 파일을 확인 후 다시 실행하세요.')
    process.exit(1)
  }

  // DB 업데이트용 SQL문 출력
  const baseUrl = `${PUBLIC_URL}/${BUCKET}`
  console.log('=== [단계 2] 프로덕션 DB에서 실행할 SQL ===')
  console.log('아래 SQL을 프로덕션 MariaDB에서 실행하세요:\n')
  console.log('-- ============================================')
  console.log('-- MinIO S3 마이그레이션: URL 업데이트 SQL')
  console.log(`-- 기준 URL: ${baseUrl}`)
  console.log('-- ============================================\n')
  console.log('-- 실행 전 백업 권장: mysqldump -u [user] -p [dbname] > backup.sql\n')
  console.log(`-- 1. users.profile_image (/uploads/xxx → ${baseUrl}/uploads/xxx)`)
  console.log(`UPDATE users SET profile_image = CONCAT('${baseUrl}', profile_image)`)
  console.log(`WHERE profile_image LIKE '/uploads/%';\n`)
  console.log(`-- 2. portfolios.image`)
  console.log(`UPDATE portfolios SET image = CONCAT('${baseUrl}', profile_image)`)
  console.log(`WHERE image LIKE '/uploads/%';\n`)
  console.log(`-- 3. bgm_tracks.url (/uploads/xxx.mp3 → ${baseUrl}/bgm/xxx.mp3)`)
  console.log(`UPDATE bgm_tracks SET url = REPLACE(url, '/uploads/', '${baseUrl}/bgm/')`)
  console.log(`WHERE url LIKE '/uploads/%';\n`)
  console.log(`-- 4. site_settings (profile_image)`)
  console.log(`UPDATE site_settings SET setting_value = CONCAT('${baseUrl}', setting_value)`)
  console.log(`WHERE setting_key = 'profile_image' AND setting_value LIKE '/uploads/%';\n`)
  console.log(`-- 5. attachments.file_path`)
  console.log(`UPDATE attachments SET file_path = CONCAT('${baseUrl}', file_path)`)
  console.log(`WHERE file_path LIKE '/uploads/%';\n`)
  console.log(`-- 6. posts.content (HTML 내 이미지 경로)`)
  console.log(`UPDATE posts SET content = REPLACE(content, '"/uploads/', '"${baseUrl}/uploads/')`)
  console.log(`WHERE content LIKE '%/uploads/%';\n`)
  console.log(`UPDATE posts SET content = REPLACE(content, "'/uploads/", "'${baseUrl}/uploads/")`)
  console.log(`WHERE content LIKE '%/uploads/%';\n`)
  console.log(`-- 7. diary_entries.content (HTML 내 이미지 경로)`)
  console.log(`UPDATE diary_entries SET content = REPLACE(content, '"/uploads/', '"${baseUrl}/uploads/')`)
  console.log(`WHERE content LIKE '%/uploads/%';\n`)
  console.log(`UPDATE diary_entries SET content = REPLACE(content, "'/uploads/", "'${baseUrl}/uploads/")`)
  console.log(`WHERE content LIKE '%/uploads/%';\n`)
  console.log(`-- 8. portfolios.content (HTML 내 이미지 경로)`)
  console.log(`UPDATE portfolios SET content = REPLACE(content, '"/uploads/', '"${baseUrl}/uploads/')`)
  console.log(`WHERE content LIKE '%/uploads/%';\n`)
  console.log(`UPDATE portfolios SET content = REPLACE(content, "'/uploads/", "'${baseUrl}/uploads/")`)
  console.log(`WHERE content LIKE '%/uploads/%';\n`)
  console.log('-- ============================================')
  console.log('-- SQL 끝')
  console.log('-- ============================================')
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err)
  process.exit(1)
})
