# Portfolio Bug Fix & Multi-Image Support

## Date: 2026-03-07

## Summary
1. 코드 블록/이미지로 인한 레이아웃 깨짐 버그 수정
2. 코드 블록 글씨 가시성 문제 수정
3. 대표 이미지 2개까지 지원

## Changes

### Bug Fix: Layout Overflow
- `globals.css`: `pre` 블록에 `max-w-full`, `white-space: pre-wrap`, `word-break: break-word` 추가
- `PortfolioDetail.tsx`: 이미지 컨테이너에 `overflow-hidden`, prose div에 `overflow-hidden` 추가

### Bug Fix: Code Block Visibility
- `globals.css`: `pre code`에 명시적 텍스트 색상 `text-slate-800 dark:text-slate-200` 적용

### Feature: Multi-Image Support (up to 2)
- `portfolio-images.ts`: 이미지 파싱/직렬화 유틸리티 (JSON 배열 방식, 하위 호환)
- `portfolio.ts` (validation): `image` 필드를 `string | string[]` union 타입으로 변경
- API routes: 배열 이미지 직렬화 후 DB 저장
- `PortfolioWriteModal`: 2개 이미지 슬롯 UI
- `PortfolioDetail`: 2개 이미지 나란히 표시
- `PortfolioContent`: 카드 목록에서 첫 번째 이미지만 표시
- `DraftData` 타입 업데이트 (useLocalDraft, usePortfolios)

## Files Modified
- src/app/globals.css
- src/components/content/PortfolioDetail.tsx
- src/components/content/PortfolioContent.tsx
- src/components/admin/PortfolioWriteModal.tsx
- src/lib/validations/portfolio.ts
- src/app/api/portfolios/route.ts
- src/app/api/portfolios/[id]/route.ts
- src/hooks/useLocalDraft.ts
- src/hooks/usePortfolios.ts

## Files Created
- src/lib/portfolio-images.ts
- src/lib/portfolio-images.test.ts
