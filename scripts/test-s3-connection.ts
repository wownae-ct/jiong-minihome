/**
 * MinIO S3 연결 테스트 스크립트
 * 실행: npx tsx scripts/test-s3-connection.ts
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const { MINIO_ENDPOINT, MINIO_PUBLIC_URL, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET, MINIO_REGION } = process.env

console.log('=== MinIO S3 연결 테스트 ===\n')
console.log(`Endpoint: ${MINIO_ENDPOINT}`)
console.log(`Public URL: ${MINIO_PUBLIC_URL}`)
console.log(`Bucket: ${MINIO_BUCKET}`)
console.log(`Region: ${MINIO_REGION}`)
console.log('')

if (!MINIO_ENDPOINT || !MINIO_ACCESS_KEY || !MINIO_SECRET_KEY || !MINIO_BUCKET) {
  console.error('ERROR: 필수 환경변수가 설정되지 않았습니다.')
  process.exit(1)
}

const s3Client = new S3Client({
  endpoint: MINIO_ENDPOINT,
  region: MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
})

async function runTest() {
  const testKey = `uploads/test-${Date.now()}.txt`
  const testContent = 'Hello from MinIO S3 connection test!'
  const publicUrl = `${MINIO_PUBLIC_URL?.replace(/\/$/, '')}/${MINIO_BUCKET}/${testKey}`

  // 1. 파일 업로드 테스트
  console.log(`[1/4] 파일 업로드 테스트: ${testKey}`)
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    }))
    console.log('  -> 업로드 성공\n')
  } catch (err) {
    console.error('  -> 업로드 실패:', err)
    process.exit(1)
  }

  // 2. 파일 존재 확인
  console.log(`[2/4] 파일 존재 확인 (HeadObject)`)
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: testKey,
    }))
    console.log('  -> 파일 존재 확인 성공\n')
  } catch (err) {
    console.error('  -> 파일 존재 확인 실패:', err)
    process.exit(1)
  }

  // 3. Public URL 접근 테스트
  console.log(`[3/4] Public URL 접근 테스트: ${publicUrl}`)
  try {
    const response = await fetch(publicUrl)
    if (response.ok) {
      const body = await response.text()
      console.log(`  -> HTTP ${response.status}, 내용: "${body}"`)
      console.log('  -> Public URL 접근 성공\n')
    } else {
      console.error(`  -> HTTP ${response.status}: Public URL 접근 실패`)
      console.error('  -> 버킷 Access Policy가 public인지 확인하세요.')
      process.exit(1)
    }
  } catch (err) {
    console.error('  -> Public URL 접근 실패:', err)
    process.exit(1)
  }

  // 4. 파일 삭제 테스트
  console.log(`[4/4] 파일 삭제 테스트`)
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: testKey,
    }))
    console.log('  -> 삭제 성공\n')
  } catch (err) {
    console.error('  -> 삭제 실패:', err)
    process.exit(1)
  }

  console.log('=== 모든 테스트 통과! MinIO 연동 준비 완료 ===')
}

runTest().catch((err) => {
  console.error('테스트 실패:', err)
  process.exit(1)
})
