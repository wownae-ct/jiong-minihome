# Profile Image Fix + Community Rich Text Editor Plan

## Summary

두 가지 작업을 5개 Phase로 나누어 구현합니다:
1. **프로필 이미지 깨짐 수정** (Phase 1)
2. **커뮤니티 글쓰기 리치 에디터 통합** (Phase 2~5)

## 선택된 옵션

| 리뷰 섹션 | 이슈 | 선택 |
|-----------|------|------|
| Architecture | 프로필 이미지 인증 흐름 | 1A: 명시적 전파 + onError 폴백 |
| Architecture | PostForm 에디터 | 2A: 기존 RichTextEditor 통합 + 확장 |
| Code Quality | XSS 방어 | 3A: DOMPurify 양쪽 새니타이징 |
| Tests | 테스트 전략 | 4A: 변경 코드 단위 테스트 |
| Performance | 비디오 업로드 | 5C: Presigned URL 클라이언트 직접 업로드 |

---

## Phase 1: 프로필 이미지 수정 (Bug Fix)

### 1-1. Auth Callbacks 이미지 전파 수정

**파일**: `src/lib/auth-callbacks.ts`

**변경 사항**:
- `handleJwtCallback`: `user` 객체가 있을 때 `token.picture = user.image` 명시적 설정
- `handleSessionCallback`: `session.user.image = token.picture` 명시적 설정

```typescript
// handleJwtCallback (line 58-61)
if (user) {
  token.id = user.id
  token.role = (user as { role?: string }).role || 'user'
  token.picture = (user as { image?: string }).image || token.picture
}

// handleSessionCallback (line 168-171)
if (session.user) {
  session.user.id = token.id as string
  session.user.role = token.role as string
  session.user.image = (token.picture as string) || undefined
}
```

### 1-2. `<img>` 태그에 onError 폴백 추가

**대상 파일**:
- `src/components/auth/UserMenu.tsx` (line 66-70)
- `src/components/guestbook/GuestbookEntry.tsx` (line 83-93)
- `src/components/community/PostDetail.tsx` (line 166-171)
- `src/components/community/MemberProfileModal.tsx` (line 126-136)
- `src/components/community/CommentItem.tsx` (line 125-135)

**패턴**: 재사용 가능한 `ProfileAvatar` 컴포넌트 생성

```typescript
// src/components/common/ProfileAvatar.tsx
interface ProfileAvatarProps {
  src: string | null | undefined
  alt: string
  size?: 'sm' | 'md' | 'lg'  // sm=8, md=10, lg=16
  className?: string
}

export function ProfileAvatar({ src, alt, size = 'md', className }: ProfileAvatarProps) {
  const [hasError, setHasError] = useState(false)
  const sizeClass = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-16 h-16' }[size]
  const textSize = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }[size]

  if (!src || hasError) {
    return (
      <div className={`${sizeClass} rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium ${textSize} ${className}`}>
        {alt[0]?.toUpperCase() || '?'}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClass} rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
    />
  )
}
```

**DRY 효과**: 5개 파일에서 중복된 프로필 이미지 렌더링 로직을 하나의 컴포넌트로 통합

### 1-3. 테스트 작성

- `src/lib/__tests__/auth-callbacks.test.ts`: JWT/Session 콜백 이미지 전파 테스트
- `src/components/common/__tests__/ProfileAvatar.test.tsx`: onError 폴백 테스트

---

## Phase 2: 업로드 API 확장 (Presigned URL + 비디오 지원)

### 2-1. Presigned URL 유틸리티

**파일**: `src/lib/s3.ts` — 새 함수 추가

```typescript
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(s3PublicClient, command, { expiresIn })
}
```

### 2-2. Presigned URL API 엔드포인트

**새 파일**: `src/app/api/upload/presign/route.ts`

```typescript
// POST /api/upload/presign
// Request: { filename: string, contentType: string, type: 'post' | 'profile' }
// Response: { presignedUrl: string, key: string, publicUrl: string }
```

- 인증 필수 (requireAuth)
- 파일 유형 검증 (이미지 + 비디오)
- 고유 키 생성 (UUID)
- 비디오 허용 타입: `video/mp4, video/webm, video/quicktime`
- 비디오 최대 크기: 50MB (클라이언트 측에서 검증)

### 2-3. 기존 Upload API 권한 수정

**파일**: `src/app/api/upload/route.ts`

- `uploadType === 'post'`도 모든 인증된 사용자에게 허용 (기존: admin만)

### 2-4. 패키지 설치

```bash
npm install @aws-sdk/s3-request-presigner
npm install isomorphic-dompurify
```

### 2-5. 테스트 작성

- `src/app/api/upload/__tests__/presign.test.ts`: Presigned URL 생성 테스트

---

## Phase 3: RichTextEditor 확장 (비디오, 색상, 폰트 크기)

### 3-1. TipTap 확장 설치

```bash
npm install @tiptap/extension-youtube @tiptap/extension-font-size
```

> Note: `@tiptap/extension-youtube`로 YouTube 임베드 지원. 일반 비디오는 커스텀 노드 또는 HTML video 태그 사용.

### 3-2. RichTextEditor 확장 추가

**파일**: `src/components/editor/RichTextEditor.tsx`

추가할 TipTap 확장:
- `Youtube` — YouTube URL 임베드
- `FontSize` — 글자 크기 변경 (또는 커스텀 확장)
- 비디오 파일 업로드용 커스텀 핸들러

새 props:
```typescript
interface RichTextEditorProps {
  // 기존 props...
  onVideoUpload?: (file: File) => Promise<string>  // 비디오 업로드 콜백
}
```

### 3-3. EditorToolbar 확장

**파일**: `src/components/editor/EditorToolbar.tsx`

추가할 툴바 항목:
- **색상 피커**: `<input type="color">` + 프리셋 색상 팔레트 (드롭다운)
- **폰트 크기**: 드롭다운 (`12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px`)
- **비디오 업로드**: 파일 선택 버튼 (video/* accept)
- **YouTube 임베드**: URL 입력 팝오버

### 3-4. 테스트 작성

- `src/components/editor/__tests__/EditorToolbar.test.tsx`: 새 툴바 버튼 테스트

---

## Phase 4: PostForm 리치 에디터 통합

### 4-1. PostForm 수정

**파일**: `src/components/community/PostForm.tsx`

변경 사항:
- `<Textarea>` → `<RichTextEditor>` 교체
- react-hook-form 연동: `Controller` 사용 (onChange/value 바인딩)
- 이미지 업로드 핸들러: 기존 `/api/upload` API 사용
- 비디오 업로드 핸들러: Presigned URL 방식 사용

```typescript
import { Controller } from 'react-hook-form'

<Controller
  name="content"
  control={control}
  render={({ field }) => (
    <RichTextEditor
      content={field.value || ''}
      onChange={field.onChange}
      label="내용"
      error={errors.content?.message}
      onImageUpload={handleImageUpload}
      onVideoUpload={handleVideoUpload}
    />
  )}
/>
```

### 4-2. 업로드 핸들러 구현

```typescript
const handleImageUpload = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', 'post')
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const { url } = await res.json()
  return url
}

const handleVideoUpload = async (file: File): Promise<string> => {
  // 1. Presigned URL 요청
  const res = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      type: 'post',
    }),
  })
  const { presignedUrl, publicUrl } = await res.json()

  // 2. 브라우저에서 MinIO로 직접 업로드
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

  return publicUrl
}
```

### 4-3. Upload API 권한 수정

`src/app/api/upload/route.ts` — `type === 'post'`일 때 모든 인증된 사용자 허용

### 4-4. 테스트 작성

- PostForm 에디터 통합 테스트

---

## Phase 5: PostDetail HTML 렌더링 + XSS 방어

### 5-1. Sanitize 유틸리티 생성

**새 파일**: `src/lib/sanitize.ts`

```typescript
import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'del',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img', 'video', 'source', 'iframe',
  'span', 'div', 'hr',
]

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class',
  'target', 'rel', 'width', 'height',
  'style', 'controls', 'autoplay', 'muted',
  'allowfullscreen', 'frameborder',
  'data-youtube-video',
]

const ALLOWED_STYLES = [
  'color', 'font-size', 'text-align',
  'background-color',
]

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  })
}
```

### 5-2. PostDetail HTML 렌더링

**파일**: `src/components/community/PostDetail.tsx`

```typescript
// Before:
<div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
  {post.content}
</div>

// After:
<div
  className="prose dark:prose-invert max-w-none"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
/>
```

**하위 호환성**: 기존 plain text 게시글도 HTML로 렌더링하면 줄바꿈이 사라지므로,
content에 HTML 태그가 포함되지 않은 경우 기존 `whitespace-pre-wrap` 방식 유지:

```typescript
const isHtmlContent = /<[a-z][\s\S]*>/i.test(post.content)

{isHtmlContent ? (
  <div
    className="prose dark:prose-invert max-w-none"
    dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
  />
) : (
  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
    {post.content}
  </div>
)}
```

### 5-3. 서버 측 Sanitize (API 저장 시)

**파일**: `src/app/api/posts/route.ts` — POST 핸들러에서 `sanitizeHtml(content)` 적용
**파일**: `src/app/api/posts/[id]/route.ts` — PUT 핸들러에서 `sanitizeHtml(content)` 적용

### 5-4. 테스트 작성

- `src/lib/__tests__/sanitize.test.ts`: XSS 벡터 필터링 테스트
- PostDetail HTML/plaintext 분기 렌더링 테스트

---

## 수정 파일 목록

### 수정
| 파일 | 변경 내용 |
|------|----------|
| `src/lib/auth-callbacks.ts` | 이미지 전파 명시적 설정 |
| `src/lib/s3.ts` | presigned URL 함수 + public S3 클라이언트 추가 |
| `src/app/api/upload/route.ts` | post 타입 권한 수정 |
| `src/components/auth/UserMenu.tsx` | ProfileAvatar 컴포넌트 사용 |
| `src/components/guestbook/GuestbookEntry.tsx` | ProfileAvatar 컴포넌트 사용 |
| `src/components/community/PostDetail.tsx` | HTML 렌더링 + ProfileAvatar |
| `src/components/community/MemberProfileModal.tsx` | ProfileAvatar 컴포넌트 사용 |
| `src/components/community/CommentItem.tsx` | ProfileAvatar 컴포넌트 사용 |
| `src/components/community/PostForm.tsx` | RichTextEditor 통합 |
| `src/components/editor/RichTextEditor.tsx` | 비디오/YouTube 확장 추가 |
| `src/components/editor/EditorToolbar.tsx` | 색상/폰트 크기/비디오 버튼 추가 |
| `src/app/api/posts/route.ts` | 서버 측 sanitize |
| `src/app/api/posts/[id]/route.ts` | 서버 측 sanitize |

### 신규
| 파일 | 내용 |
|------|------|
| `src/components/common/ProfileAvatar.tsx` | 재사용 프로필 아바타 컴포넌트 |
| `src/lib/sanitize.ts` | DOMPurify 래퍼 유틸리티 |
| `src/app/api/upload/presign/route.ts` | Presigned URL 엔드포인트 |
| `src/lib/__tests__/auth-callbacks.test.ts` | Auth 콜백 테스트 |
| `src/lib/__tests__/sanitize.test.ts` | Sanitize 유틸 테스트 |
| `src/components/common/__tests__/ProfileAvatar.test.tsx` | ProfileAvatar 테스트 |
| `src/app/api/upload/__tests__/presign.test.ts` | Presign API 테스트 |

### 패키지 설치
```bash
npm install @aws-sdk/s3-request-presigner isomorphic-dompurify @tiptap/extension-youtube
npm install -D @types/dompurify
```

> Note: `@tiptap/extension-font-size`가 별도 패키지로 없는 경우, TextStyle 확장의 커스텀 속성으로 구현

---

## 리스크 및 주의사항

1. **MinIO CORS 설정 필요**: Presigned URL로 브라우저에서 직접 업로드하려면 MinIO에 CORS 정책 추가 필요
   ```json
   {
     "CORSRules": [{
       "AllowedOrigins": ["https://your-domain.com"],
       "AllowedMethods": ["PUT"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }]
   }
   ```

2. **기존 plain text 게시글 호환**: HTML 판별 로직으로 기존 게시글은 그대로 렌더링

3. **Presigned URL 엔드포인트**: `MINIO_PUBLIC_URL`이 브라우저에서 접근 가능한 URL이어야 함. 그렇지 않으면 presigned URL도 브라우저에서 접근 불가

4. **DOMPurify style 허용**: `color`, `font-size` 같은 인라인 스타일은 허용하되 `position`, `display` 같은 위험한 속성은 차단
