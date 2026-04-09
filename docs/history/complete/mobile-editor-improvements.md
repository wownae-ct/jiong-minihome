# Mobile & Editor UX Improvements

**작성일**: 2026-04-09
**상태**: 작업 시작
**담당**: wownae-ct + Claude Opus 4.6

---

## 배경

사용자가 제기한 5가지 UX/버그 이슈:
1. 모바일 사진 2번째 터치 시 라이트박스 미작동 (근본 원인 미해결 상태)
2. 모바일 글씨 크기 축소 필요
3. 커뮤니티 에디터 색상 picker UX 불량 (색상 겹침)
4. 에디터 툴바 아이콘 크기 축소
5. 포트폴리오 임시저장 시 모달 안 닫힘 + 단일 슬롯 → 3 슬롯 + 진입 시 선택

기존 수정 이력:
- `665e6ea` feat: 모바일 UX 개선 — 이미지 라이트박스 + 반응형 패딩 정규화
- `ede29da` fix: 모바일 이미지 라이트박스 터치 반응성 개선
- `c39ae84` fix: 라이트박스 두 번째 탭 실패 근본 수정 (closingRef + closedAtRef 300ms 쿨다운)
- `89b9198` fix: 탭 전환 안정성 버그 근본 수정

→ 자체 라이트박스를 계속 패치해왔으나 근본 해결이 안 됨. **PhotoSwipe v5** 도입으로 구조적 해결.

---

## 확정 결정 사항

| 결정 | 선택 | 이유 |
|---|---|---|
| 라이트박스 해결 방향 | **Option A: PhotoSwipe v5** | 검증된 라이브러리, 모바일 엣지 케이스 처리, 핀치 줌/스와이프 닫기 무료 제공 |
| 임시저장 인식 개선 | **α+γ: 인라인 인디케이터 + 헤더 칩** | 사용자가 저장 상태를 지속적으로 인식 가능 |
| 모바일 글씨 축소 방식 | **전역 Tailwind base config** | 일관성 ↑, 누락 위험 ↓ |
| 추가 도출 항목 | **모두 포함** | 접근성/유지보수성 포함 |

---

## 설계

### 1. 라이트박스 (PhotoSwipe v5)

**의존성 추가**:
```
npm install photoswipe
```

**공통 hook 추출** — `src/hooks/useLightbox.ts`:
```ts
'use client'
import { useCallback, useEffect, useRef } from 'react'

export function useLightbox() {
  const lightboxRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      lightboxRef.current?.destroy()
      lightboxRef.current = null
    }
  }, [])

  const openLightbox = useCallback(async ({ src, alt }: { src: string; alt?: string }) => {
    const [{ default: PhotoSwipeLightbox }] = await Promise.all([
      import('photoswipe/lightbox'),
    ])

    const { width, height } = await measureImage(src)

    lightboxRef.current?.destroy()
    const lightbox = new PhotoSwipeLightbox({
      dataSource: [{ src, width, height, alt }],
      pswpModule: () => import('photoswipe'),
      bgOpacity: 0.9,
      showHideAnimationType: 'fade',
      closeOnVerticalDrag: true,
    })
    lightbox.init()
    lightbox.loadAndOpen(0)
    lightboxRef.current = lightbox
  }, [])

  return { openLightbox }
}

function measureImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 1920, height: 1080 })
    img.src = src
  })
}
```

**CSS import**: `src/app/globals.css`에 `@import 'photoswipe/style.css';` 추가

**호출부 3곳 마이그레이션**:
- `src/components/sidebar/ProfileCard.tsx`
- `src/components/community/PostDetail.tsx`
- `src/components/content/PortfolioDetail.tsx`

→ 모든 `closedAtRef`/`closingRef`/`ImageLightbox` 제거, `useLightbox()` hook으로 통일

**삭제 대상**:
- `src/components/ui/ImageLightbox.tsx` (기존 자체 구현)
- `src/components/ui/ImageLightbox.test.tsx`

### 2. 에디터 UX (EditorToolbar)

**색상 picker 재구성** ([src/components/editor/EditorToolbar.tsx:42-45](src/components/editor/EditorToolbar.tsx#L42-L45)):
- 현재: 10색 5×2 그리드, 24×24px cell
- 변경: 16색 4×4 그리드, 32×32px cell + gap-2, aria-label 추가
- 색상 팔레트 확장: 검정, 회색 2단, 빨강, 주황, 노랑, 라임, 초록, 청록, 파랑 2단, 보라, 핑크, 갈색, 흰색
- 각 cell에 `aria-label={colorName}` + `title={colorName}`

**툴바 아이콘 축소**:
- 데스크톱: `p-1.5` → `p-1`, 아이콘 16px 유지 (컨테이너 28 → 24px)
- 모바일: 현재 유지 (접근성 44×44 가이드라인 고려해 `sm:p-1` 형태로 분기)
- ToolbarDivider 높이 `h-6` → `h-5`
- gap `gap-1` → `gap-0.5`

### 3. 모바일 Typography 전역 축소

**전략**: `tailwind.config.ts`의 `theme.extend.fontSize` 또는 base layer 활용

- **접근 방법**: `@layer base`에서 `html` 기본 font-size를 모바일에서 15px로 (기본 16px)
- `html { font-size: 15px; } @media (min-width: 768px) { html { font-size: 16px; } }`
- rem 기반이므로 전 컴포넌트가 자연스럽게 스케일 다운
- 헤딩 (`text-2xl`, `text-xl`) 등은 rem 기반이라 비례 축소
- 고정 px (프로필 이미지 등)은 영향 없음

**주의**:
- 접근성: 사용자 OS 폰트 스케일 존중을 위해 `html`의 font-size는 `%` 또는 `rem`이 이상적이나, mobile-first 디자인 일관성 우선
- 터치 타겟은 px로 고정된 영역 (`w-10 h-10` = 40px)은 rem 영향 안 받으므로 안전

### 4. 포트폴리오 임시저장 다중 슬롯

**데이터 모델** — `src/hooks/useLocalDraft.ts` 리팩토링:
```ts
interface SavedDraft {
  id: string                   // slot-1 | slot-2 | slot-3 | edit-{portfolioId}
  slotIndex?: number           // 1~3 (new 글 전용)
  portfolioId?: number         // 수정 모드 전용
  data: DraftData
  savedAt: string
  title?: string               // 미리보기용 (data.title 복사)
}

const MAX_NEW_SLOTS = 3
const DRAFT_KEY = 'portfolio_drafts'  // 기존 key 유지, 구조만 변경
```

**Migration 전략**:
- 로드 시 기존 단일 슬롯 감지 → slot-1로 변환 후 저장
- 에러 발생 시 해당 데이터 discard (fail-safe)

**새 API**:
- `useDraftSlots()`: 3 슬롯 목록 조회 + 빈 슬롯 찾기
- `useDraftSlot(slotIndex | portfolioId)`: 특정 슬롯 CRUD

**진입 다이얼로그** (새 글 모드):
- "글쓰기" 버튼 클릭 → 먼저 슬롯 상태 확인
- 저장된 슬롯 0개: 곧바로 빈 에디터 열기
- 저장된 슬롯 1개 이상: **선택 다이얼로그** 표시
  - 각 슬롯 카드: 제목 + 저장 시간 + 내용 미리보기 30자
  - "새로 작성" 버튼 (빈 슬롯 있으면 활성, 없으면 "가장 오래된 슬롯 덮어쓰기" 확인)
  - 슬롯별 "삭제" 버튼

**저장 인식성 (α+γ)**:
- **인라인 (α)**: "임시 저장" 버튼 옆에 `"마지막 저장: 22:31:45"` 텍스트 (초기: "저장 안 됨")
- **버튼 애니메이션**: 클릭 시 버튼 텍스트 "저장 중..." → 1초 후 "저장됨 ✓" (녹색) → 1.5초 후 원래 텍스트
- **헤더 칩 (γ)**: 모달 타이틀 옆에 상태 칩
  - 변경 감지: `● 변경됨` (주황)
  - 저장됨: `✓ 22:31 저장됨` (녹색)
  - 초기: 칩 없음
- 기존 토스트는 제거 (중복 알림 방지)

**수정 모드는?**
- 수정 모드는 기존 단일 슬롯 유지 (portfolioId별 1개)
- 인디케이터/헤더 칩은 동일 적용

### 5. 접근성 & 추가 작업

- 색상 picker aria-label
- 터치 타겟 44×44 가이드라인 체크 (툴바 모바일 분기)
- PhotoSwipe는 기본적으로 focus trap / ESC / aria 처리 지원

---

## Phase 별 작업 계획 (TDD)

### Phase 1 — 라이트박스 근본 수정 (최우선)

**목표**: PhotoSwipe v5 도입, 자체 라이트박스 제거, 3곳 호출부 통일

**TDD Steps**:
1. `npm install photoswipe`
2. `src/hooks/useLightbox.test.ts` 작성 — measureImage 유틸 테스트 + hook API 계약 테스트 (mocked lightbox)
3. `src/hooks/useLightbox.ts` 구현
4. `src/app/globals.css`에 `@import 'photoswipe/style.css';` 추가
5. `ProfileCard.tsx` 마이그레이션 + 기존 테스트 통과 확인
6. `PostDetail.tsx` 마이그레이션 + prose img 이벤트 위임 유지
7. `PortfolioDetail.tsx` 마이그레이션
8. `ImageLightbox.tsx`, `ImageLightbox.test.tsx` 삭제
9. 빌드 + lint

**Acceptance**:
- [ ] 모바일 첫 탭 / 두 번째 탭 / N번째 탭 모두 라이트박스 정상 작동 (수동 검증)
- [ ] 핀치 줌, 스와이프-to-close 동작
- [ ] 기존 단위 테스트 통과
- [ ] 새 테스트 통과

---

### Phase 2 — 에디터 UX 개선

**목표**: 색상 picker 확장 + 툴바 축소

**TDD Steps**:
1. `EditorToolbar.test.tsx` 수정 — 색상 16개, aria-label 존재, grid 4×4 검증
2. `PRESET_COLORS` 16개 확장 + 색상 이름 매핑 `PRESET_COLOR_LABELS`
3. grid className `grid-cols-5 gap-1` → `grid-cols-4 gap-2`
4. cell `w-6 h-6` → `w-8 h-8`
5. `ToolbarButton`의 padding `p-1.5` → `p-1` (sm:p-1 / 모바일 p-1.5)
6. `ToolbarDivider` `h-6` → `h-5`
7. 빌드 + lint

**Acceptance**:
- [ ] 색상 16개 모두 선택 가능, 시각적으로 겹치지 않음
- [ ] 각 색상 버튼에 aria-label
- [ ] 툴바 데스크톱 축소 확인, 모바일 터치 영역 유지

---

### Phase 3 — 모바일 Typography 축소

**목표**: 전역 폰트 크기 모바일 축소

**TDD Steps**:
1. `src/app/globals.css`에 `@layer base { html { font-size: 15px } @media (min-width: 768px) { html { font-size: 16px } } }` 추가
2. 주요 페이지 빌드 + 시각 확인
3. 눈에 띄는 깨짐 발생 시 개별 컴포넌트 보정

**Acceptance**:
- [ ] 빌드 성공
- [ ] 모바일 가독성 개선 확인
- [ ] 데스크톱 레이아웃 회귀 없음
- [ ] 터치 타겟 44×44 유지

---

### Phase 4 — 포트폴리오 임시저장 다중 슬롯 + 인디케이터

**목표**: 3 슬롯 드래프트 + α+γ 인디케이터

**TDD Steps**:
1. `useLocalDraft.test.ts` 업데이트 — 다중 슬롯 API 테스트 (`useDraftSlots`)
2. `useLocalDraft.ts` 리팩토링:
   - `useDraftSlots()` 훅 추가
   - legacy migration 로직
   - `MAX_NEW_SLOTS = 3` 상수
3. `DraftSlotPicker.tsx` 컴포넌트 작성 (신규) — 3 슬롯 카드 + "새로 작성" 버튼
4. `DraftSlotPicker.test.tsx` 작성
5. `SaveIndicator.tsx` 컴포넌트 작성 (헤더 칩 + 인라인 상태)
6. `SaveIndicator.test.tsx` 작성
7. `PortfolioWriteModal.tsx`:
   - `showDraftRestore` 다이얼로그 → `showDraftPicker` (3 슬롯 지원)
   - `handleSaveDraft` 인디케이터 state 업데이트
   - 헤더에 `SaveIndicator` 배치
   - 기존 토스트 제거
8. 빌드 + 회귀 테스트

**Acceptance**:
- [ ] 드래프트 3개까지 저장 가능, 4번째 시도 시 UI에서 슬롯 선택 또는 덮어쓰기 확인
- [ ] 글쓰기 버튼 진입 시 슬롯 선택 다이얼로그 표시
- [ ] 임시저장 시 버튼 애니메이션 + 헤더 칩 갱신
- [ ] 모달 새로고침 후에도 저장 상태 유지 (localStorage)
- [ ] legacy 단일 슬롯 migration 정상 동작

---

### Phase 5 — 검증 & 문서 이관

1. 전체 빌드 (`npm run build`)
2. Lint (`npm run lint`)
3. 수동 모바일 테스트 (iOS Safari / Android Chrome)
4. 본 문서를 `docs/history/complete/mobile-editor-improvements.md`로 이동

---

## 리스크 & 완화

| 리스크 | 심각도 | 완화 |
|---|---|---|
| PhotoSwipe CSS import가 Next.js App Router에서 깨질 수 있음 | 상 | globals.css에 `@import` 또는 layout.tsx import로 대체 검증 |
| PhotoSwipe width/height 필수 → 측정 비용 | 중 | `measureImage` Promise + error fallback |
| 전역 font-size 변경이 기존 px 기반 레이아웃 깨뜨릴 수 있음 | 중 | Phase 3 빌드 후 주요 페이지 스샷 확인 |
| localStorage migration 실패 | 중 | try/catch + fail-safe discard |
| 기존 테스트 회귀 | 상 | 각 Phase마다 단위 테스트 실행 |
| PostDetail prose img 이벤트 위임이 useLightbox와 충돌 | 상 | useEffect 리스너에서 openLightbox(src, alt) 호출로 단순화 |

---

## 변경되는 파일 요약

**신규**:
- `src/hooks/useLightbox.ts`
- `src/hooks/useLightbox.test.ts`
- `src/components/admin/DraftSlotPicker.tsx`
- `src/components/admin/DraftSlotPicker.test.tsx`
- `src/components/admin/SaveIndicator.tsx`
- `src/components/admin/SaveIndicator.test.tsx`

**수정**:
- `src/app/globals.css` (PhotoSwipe CSS + mobile font-size)
- `src/components/sidebar/ProfileCard.tsx`
- `src/components/community/PostDetail.tsx`
- `src/components/content/PortfolioDetail.tsx`
- `src/components/editor/EditorToolbar.tsx`
- `src/components/editor/EditorToolbar.test.tsx` (있다면)
- `src/components/admin/PortfolioWriteModal.tsx`
- `src/hooks/useLocalDraft.ts`
- `src/hooks/useLocalDraft.test.ts` (있다면)
- `package.json` (photoswipe 의존성)

**삭제**:
- `src/components/ui/ImageLightbox.tsx`
- `src/components/ui/ImageLightbox.test.tsx`
