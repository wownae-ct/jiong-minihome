# 비공개 MinIO 이미지 — 앱 프록시 서빙 계획

## 배경 / 목표
- 현재: 이미지가 `{MINIO_PUBLIC_URL}/portfolio-web/<key>` 절대 URL로 DB에 저장되고, 버킷이 public-read여야 표시됨.
- 결정: **버킷을 비공개로 유지**하고, 앱이 서버 자격증명으로 객체를 읽어 중계(proxy)한다.
- 효과: MinIO를 외부에 직접 노출하지 않음. URL 안정·캐시 가능. 추후 접근제어 추가 용이.

## 아키텍처
```
브라우저 <img src="/api/files/uploads/x.jpg">
   → Next.js 프록시 라우트 (서버 자격증명)
   → s3Client GetObject (비공개 MinIO 20.20.20.232)
   → 바이트 스트리밍 + Content-Type/Cache-Control/Range
```

## 핵심 결정과 트레이드오프
1. **신규 업로드 URL** — `getPublicUrl(key)`가 절대 URL 대신 `/api/files/<key>`(상대 경로) 반환.
   - 장점: 동일 출처라 `<img>`/next/image/`<audio>` 모두 동작, remotePatterns 불필요.
2. **기존 데이터(절대 MinIO URL)** 처리 — 두 갈래 병행:
   - (a) 본문 HTML(`post.content`, `portfolio.content`): 렌더 직전 `rewriteStorageHtml()`로 절대 MinIO URL → 프록시 경로 치환. **DB 변경 없음**, 구/신 모두 안전.
   - (b) 단일 이미지 필드(`user.profileImage`, `portfolio.image` 등): **일회성 DB 마이그레이션 스크립트**로 절대 URL → 프록시 경로 치환(외부 OAuth 아바타는 제외). 표시 컴포넌트 수정 0 (DRY).
   - 대안(렌더타임 변환을 전 컴포넌트에 적용)은 수십 곳 수정 + 반복 → DRY 위반이라 기각.
3. **버킷 정책** — 익명 접근 제거(private 유지). 프록시만 자격증명으로 접근.

## 단계
- **Phase 1 (코드 핵심)**: 프록시 라우트 + `getPublicUrl`/`extractKeyFromUrl` 변경 + `lib/fileUrl.ts`(순수 유틸) + 본문 HTML 치환 적용. TDD.
- **Phase 2 (마이그레이션)**: `scripts/migrate-image-urls-to-proxy.ts` — 멱등, MinIO base만 치환, 외부 URL 보존. 사용자가 실행.
- **Phase 3 (인프라)**: MinIO 버킷 익명 정책 제거(private) + curl 검증. 사용자가 실행.

## 검증 포인트
- 이미지 `<img>` 200, BGM 오디오 Range 시킹 동작(206).
- 외부 OAuth 아바타(lh3.googleusercontent.com)는 절대 변환/차단되지 않음.
- 비공개 버킷에서 프록시 경유 200, 직접 접근 403 유지.
- 잘못된/존재하지 않는 key → 404, 디렉터리 트래버설(`..`) 차단.
```
```
