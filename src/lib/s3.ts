import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

// 브라우저 직접 업로드용 public S3 클라이언트
const s3PublicClient = new S3Client({
  endpoint: process.env.MINIO_PUBLIC_URL,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
})

export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
  return getPublicUrl(key)
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  )
}

export function getPublicUrl(key: string): string {
  const baseUrl = (process.env.MINIO_PUBLIC_URL || '').replace(/\/$/, '')
  return `${baseUrl}/${BUCKET}/${key}`
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(s3PublicClient, command, { expiresIn })
}

export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null
  const baseUrl = (process.env.MINIO_PUBLIC_URL || '').replace(/\/$/, '')
  const prefix = `${baseUrl}/${BUCKET}/`
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length)
  }
  return null
}
