import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  type GetObjectCommandOutput,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { FILE_PROXY_PREFIX, extractStorageKey } from './fileUrl'

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

/**
 * 저장/표시에 쓰는 공개 경로. 버킷을 비공개로 두므로 MinIO 절대 URL 대신
 * 동일 출처 프록시 경로(/api/files/<key>)를 반환한다. (실제 객체는 프록시 라우트가 중계)
 */
export function getPublicUrl(key: string): string {
  return `${FILE_PROXY_PREFIX}/${key}`
}

/**
 * 비공개 MinIO에서 객체를 가져온다(프록시 라우트 전용). Range 헤더를 전달하면
 * 부분 응답(206)을 위한 메타데이터가 함께 채워진다.
 */
export async function getObject(key: string, range?: string): Promise<GetObjectCommandOutput> {
  return s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Range: range,
    }),
  )
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

/**
 * 저장된 값(절대 MinIO URL 또는 /api/files 프록시 경로)에서 삭제용 key를 추출한다.
 */
export function extractKeyFromUrl(url: string): string | null {
  return extractStorageKey(url)
}
