# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 방식

반드시 모든 개발은 테스트 주도 개발 방식을 사용하세요.

## Build Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Font**: Inter, Noto Sans KR (body), Gaegu (display/handwritten)

### Directory Structure

```
src/
├── app/           # Next.js App Router pages and layouts
│   ├── layout.tsx # Root layout with fonts and global styles
│   ├── page.tsx   # Homepage
│   └── globals.css
└── components/    # Reusable React components
```

## Design Reference

This is a Korean "미니홈피" (mini-homepage) style portfolio for an IT Infrastructure Engineer. Design reference files are in `stitch_it_engineer_mini_homepage_alternative/`.

### Design System

- **Primary color**: `#3b82f6` (blue-500)
- **Light background**: `#f1f5f9` (slate-100)
- **Dark background**: `#0f172a` (slate-900)
- **Dark mode**: Toggled via `class="dark"` on `<html>`
- **Icons**: Material Symbols Outlined (loaded via Google Fonts)

### Planned Sections

- Introduce (소개)
- Career (경력)
- Portfolio (포트폴리오)
- Community (커뮤니티)
- Diary (다이어리)
- Guestbook (방명록)

## File Storage (MinIO S3)

파일 업로드/삭제는 MinIO S3 오브젝트 스토리지를 사용합니다 (로컬 파일시스템 사용 안 함).

- **S3 클라이언트**: `src/lib/s3.ts` (uploadToS3, deleteFromS3, getPublicUrl, extractKeyFromUrl)
- **버킷**: `portfolio-web` (서비스 단위)
- **Key prefix**: `uploads/` (이미지), `bgm/` (오디오)
- **URL 패턴**: `{MINIO_PUBLIC_URL}/{BUCKET}/{prefix}/{uuid}.{ext}`
- **업로드 API**: `src/app/api/upload/route.ts`
- **BGM 삭제 API**: `src/app/api/bgm/[id]/route.ts`

### 환경변수 (MinIO)

```
MINIO_ENDPOINT      # S3 SDK 엔드포인트 (서버→MinIO)
MINIO_PUBLIC_URL     # 브라우저가 파일에 접근하는 URL
MINIO_ACCESS_KEY     # MinIO Access Key
MINIO_SECRET_KEY     # MinIO Secret Key
MINIO_BUCKET         # 버킷명 (portfolio-web)
MINIO_REGION         # 리전 (us-east-1)
MINIO_IMAGE_HOSTNAME # Next.js Image remotePatterns용 hostname
```

### 인프라 구조

```
[브라우저] → jiun2.ddns.net:29000 → [nginx proxy (230)] → [MinIO (232):9000]
[Next.js (231)] → nginx proxy (230) → MinIO (232):9000
```

### 마이그레이션 스크립트

- `scripts/migrate-upload-files.ts` - 로컬 파일 → MinIO 업로드 + DB SQL 생성
- `scripts/migrate-uploads-to-s3.ts` - 통합 마이그레이션 (파일 + DB, Prisma 필요)
- `scripts/test-s3-connection.ts` - MinIO 연결 테스트

## CI/CD (Jenkins + Docker)

### 파이프라인 흐름

```
Git Push → Jenkins (8080)
  → Checkout → Prepare (.env) → Build Image → Deploy → Health Check
```

### 주요 파일

- **`Jenkinsfile`** - CI/CD 파이프라인 (5 스테이지)
- **`Dockerfile`** - 3단계 멀티스테이지 빌드 (deps → builder → runner)
- **`docker-compose.yml`** - 앱 서비스 정의 (포트 3000)
- **`docker-compose.jenkins.yml`** - Jenkins 서버 정의 (포트 8080)

### 이미지 정리 전략

- 최근 3개 빌드 이미지만 보존 (`KEEP_IMAGES=3`), 나머지 자동 삭제
- BuildKit 캐시 2GB 상한 (`docker builder prune --keep-storage 2gb`)
- 댕글링 이미지 매 빌드 시 자동 정리
- Jenkins 빌드 로그 최대 10개, 30일 보관 (`buildDiscarder`)

### 빌드 최적화 (BuildKit)

- `--mount=type=cache,target=/root/.npm` - npm 캐시 재사용
- `--mount=type=cache,target=/app/.next/cache` - Next.js 증분 빌드 캐시
- `DOCKER_BUILDKIT=1` 환경변수로 활성화

### 배포 안전장치

- **사전 검증**: 새 컨테이너를 포트 3001에서 먼저 헬스체크 후 교체
- **자동 롤백**: 배포 실패 시 이전 빌드 이미지(`APP_NAME:BUILD_NUMBER-1`)로 자동 복구
- **컨테이너 자동 시작**: `restart: unless-stopped` → 서버 재부팅 시 자동 복구

### 디스크 모니터링

- `scripts/disk-monitor.sh` - cron 30분 간격 디스크 체크
- 80% 경고 로그, 90% 긴급 자동 정리
- 프로덕션 서버에서 crontab 등록 필요: `*/30 * * * * /opt/scripts/disk-monitor.sh`

## Rules for Design, Implementation, and Modification:

- **Phase-based Planning**: Split tasks into phases (High-level -> Detailed). Limit each detailed phase to <50% of session context.
- **Todo Logging**: Update the Todo file after every phase.
- **Path (Ref)**: docs/history/target/{planName}
- **Path (Done)**: docs/history/complete/{planName}
- **Indexing**: Never index docs/history/complete/ unless requested by the user.
- Adhere to the guidelines in the following file before performing any code creation or modification: docs/claude_code_prompt_for_plan_mode.md.
