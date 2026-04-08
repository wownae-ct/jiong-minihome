# Mobile UX Improvement Plan

## Overview

모바일 사용자 경험을 개선하기 위한 두 가지 핵심 작업:
1. **ImageLightbox 컴포넌트**: 이미지 탭 시 전체화면 확대 보기 (커스텀 구현, ~100줄, 외부 의존성 없음)
2. **반응형 패딩 정규화**: 모바일 breakpoint 누락된 컴포넌트의 padding 통일

## 승인된 설계 결정

| # | 결정 | 선택 |
|---|------|------|
| 1 | 라이트박스 구현 방식 | Option A: 커스텀 ImageLightbox (~100줄, Modal.tsx 패턴 활용) |
| 2 | 반응형 패딩 수정 방식 | Option A: 모바일 breakpoint 누락 컴포넌트만 타겟 수정 |
| 3 | 라이트박스 적용 범위 | Option A: PortfolioDetail 이미지 + prose 내 img + ProfileCard(선택) |

---

## Phase 1: ImageLightbox 컴포넌트 구현 (TDD)

### 목표
외부 의존성 없이 `Modal.tsx` 패턴을 참고한 전체화면 이미지 뷰어 컴포넌트를 만든다.

### 1-1. 테스트 작성

**파일**: `src/components/ui/ImageLightbox.test.tsx` (신규)

**테스트 케이스**:
- isOpen=false일 때 아무것도 렌더링하지 않는다
- isOpen=true일 때 이미지와 backdrop을 렌더링한다
- backdrop 클릭 시 onClose가 호출된다
- 닫기 버튼 클릭 시 onClose가 호출된다
- Escape 키 누르면 onClose가 호출된다
- alt 텍스트가 img 요소에 전달된다
- body overflow가 isOpen=true일 때 hidden으로 설정된다
- isOpen=false로 변경되면 body overflow가 복원된다
- 이미지가 createPortal로 body에 렌더링된다

### 1-2. ImageLightbox 컴포넌트 구현

**파일**: `src/components/ui/ImageLightbox.tsx` (신규)

**인터페이스**:
```typescript
interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt?: string
}
```

**구현 요소** (Modal.tsx 패턴 참고):
- `createPortal`로 `document.body`에 렌더링
- `fixed inset-0 z-50` 전체화면 오버레이
- backdrop: `bg-black/80 backdrop-blur-sm`, 클릭 시 닫기
- 이미지: `max-w-[90vw] max-h-[90vh] object-contain` 중앙 배치
- 닫기 버튼: 우상단 `Icon name="close"` (흰색, 반투명 배경)
- `Escape` 키 이벤트 리스너 (`useEffect` + `useCallback`)
- `body.style.overflow` 제어 (열림/닫힘 시)
- SSR 가드: `typeof window !== 'undefined'`

**예상 코드량**: ~80-100줄

### 1-3. 완료 기준
- [ ] 모든 테스트 통과
- [ ] 컴포넌트가 독립적으로 동작 (외부 의존성 없음)
- [ ] Modal.tsx와 동일한 패턴 (createPortal, Escape, backdrop, overflow)

---

## Phase 2: PortfolioDetail 이미지에 라이트박스 적용 (TDD)

### 목표
`PortfolioDetail.tsx`의 프로젝트 이미지를 클릭하면 라이트박스로 확대 표시한다.

### 2-1. 테스트 작성

**파일**: `src/components/content/PortfolioDetail.test.tsx` (신규)

**테스트 케이스**:
- 프로젝트 이미지를 클릭하면 ImageLightbox가 열린다
- ImageLightbox에 클릭한 이미지의 src가 전달된다
- 이미지에 cursor-pointer 스타일이 적용된다
- 이미지가 없는 프로젝트에서는 라이트박스가 동작하지 않는다

### 2-2. PortfolioDetail 수정

**파일**: `src/components/content/PortfolioDetail.tsx`

**변경 사항**:
- `useState<string | null>(null)` -- 라이트박스 표시할 이미지 URL
- 이미지 `<img>` 태그에 `onClick`, `cursor-pointer` 추가
- 컴포넌트 하단에 `<ImageLightbox>` 렌더링

### 2-3. 완료 기준
- [ ] 테스트 통과
- [ ] 이미지 클릭 시 전체화면 라이트박스 표시
- [ ] 라이트박스에서 닫기/backdrop/Escape 모두 동작

---

## Phase 3: prose 콘텐츠 내 img 라이트박스 적용 (TDD)

### 목표
`dangerouslySetInnerHTML`로 렌더링되는 prose 콘텐츠 내 `<img>` 태그를 클릭하면 라이트박스로 확대 표시한다.

### 3-1. useProseImageLightbox 커스텀 훅 구현

prose 콘텐츠는 `dangerouslySetInnerHTML`로 렌더링되므로 React 이벤트 바인딩이 불가능하다. DOM 이벤트 위임 방식의 커스텀 훅을 만든다.

**파일**: `src/hooks/useProseImageLightbox.ts` (신규)

**인터페이스**:
```typescript
function useProseImageLightbox(onImageClick: (src: string, alt: string) => void): {
  containerRef: React.RefObject<HTMLDivElement>
}
```

**테스트 파일**: `src/hooks/useProseImageLightbox.test.ts` (신규)

### 3-2. PortfolioDetail prose 영역에 적용

기존 Phase 2의 `lightboxSrc` state와 하나의 `<ImageLightbox>`로 프로젝트 이미지와 prose 이미지를 모두 처리.

### 3-3. PostDetail prose 영역에 적용

**파일**: `src/components/community/PostDetail.tsx`
- 라이트박스 state + useProseImageLightbox + ImageLightbox 렌더링

### 3-4. 완료 기준
- [ ] useProseImageLightbox 훅 테스트 통과
- [ ] PortfolioDetail prose 이미지 클릭 시 라이트박스 동작
- [ ] PostDetail prose 이미지 클릭 시 라이트박스 동작

---

## Phase 4: ProfileCard 이미지 라이트박스 (선택, TDD)

### 목표
사이드바 프로필 이미지를 클릭하면 라이트박스로 확대 표시한다.

### 4-1. ProfileCard 수정

**파일**: `src/components/sidebar/ProfileCard.tsx`
- `useState<boolean>(false)` -- isLightboxOpen
- `<Image>` 래퍼에 `onClick` + `cursor-pointer` 추가
- 컴포넌트 하단에 `<ImageLightbox>` 렌더링

### 4-2. 완료 기준
- [ ] 프로필 이미지 클릭 시 원본 크기로 라이트박스 표시
- [ ] 로딩 중에는 클릭 비활성화

---

## Phase 5: 반응형 패딩 정규화

### 목표
모바일 breakpoint가 누락된 패딩을 통일한다.

### 5-1. 수정 대상 파일 및 변경 내용

| 파일 | 기존 | 변경 |
|------|------|------|
| `DiaryCard.tsx` | `p-6` | `p-4 sm:p-6` |
| `ProjectCard.tsx` | `p-6` | `p-4 sm:p-6` |
| `DiaryContent.tsx` (2곳) | `p-6` | `p-4 sm:p-6` |
| `GuestbookForm.tsx` | `p-6` | `p-4 sm:p-6` |
| `CommentSection.tsx` | `p-6` | `p-4 sm:p-6` |
| `WelcomeDetail.tsx` | `p-6 md:p-8` | `p-4 sm:p-6 md:p-8` |
| `MainLayout.tsx` (2곳) | `p-6 md:p-8` | `p-4 sm:p-6 md:p-8` |
| `WelcomeSection.tsx` | `p-8 md:p-12` | `p-4 sm:p-8 md:p-12` |

### 5-2. 완료 기준
- [ ] 10개 파일의 패딩이 모바일 breakpoint 포함 패턴으로 변경
- [ ] 모든 기존 테스트 통과

---

## 구현 순서

```
Phase 1: ImageLightbox 컴포넌트 (독립, 의존성 없음)
  └─ 테스트 → 구현 → GREEN

Phase 2: PortfolioDetail 이미지 라이트박스 (Phase 1 의존)
  └─ 테스트 → PortfolioDetail 수정 → GREEN

Phase 3: prose 콘텐츠 라이트박스 (Phase 1 의존)
  └─ useProseImageLightbox 훅 테스트 → 훅 구현
  └─ PortfolioDetail prose 적용 → PostDetail prose 적용 → GREEN

Phase 4: ProfileCard 라이트박스 (Phase 1 의존, 선택)
  └─ ProfileCard 수정 → GREEN

Phase 5: 반응형 패딩 정규화 (독립, Phase 1-4와 무관)
  └─ 10개 파일 수정 → GREEN
```

## 신규 파일

| 파일 | 용도 |
|------|------|
| `src/components/ui/ImageLightbox.tsx` | 라이트박스 컴포넌트 |
| `src/components/ui/ImageLightbox.test.tsx` | 라이트박스 테스트 |
| `src/hooks/useProseImageLightbox.ts` | prose 이미지 클릭 훅 |
| `src/hooks/useProseImageLightbox.test.ts` | prose 훅 테스트 |

## 수정 파일

| 파일 | Phase | 변경 내용 |
|------|-------|-----------|
| `PortfolioDetail.tsx` | 2, 3 | 라이트박스 state + onClick + prose ref |
| `PostDetail.tsx` | 3 | 라이트박스 state + useProseImageLightbox |
| `ProfileCard.tsx` | 4 | 라이트박스 state + onClick |
| `DiaryCard.tsx` | 5 | p-6 -> p-4 sm:p-6 |
| `ProjectCard.tsx` | 5 | p-6 -> p-4 sm:p-6 |
| `DiaryContent.tsx` | 5 | p-6 -> p-4 sm:p-6 (2곳) |
| `GuestbookForm.tsx` | 5 | p-6 -> p-4 sm:p-6 |
| `CommentSection.tsx` | 5 | p-6 -> p-4 sm:p-6 |
| `WelcomeDetail.tsx` | 5 | p-6 md:p-8 -> p-4 sm:p-6 md:p-8 |
| `MainLayout.tsx` | 5 | p-6 md:p-8 -> p-4 sm:p-6 md:p-8 (2곳) |
| `WelcomeSection.tsx` | 5 | p-8 md:p-12 -> p-4 sm:p-8 md:p-12 |
