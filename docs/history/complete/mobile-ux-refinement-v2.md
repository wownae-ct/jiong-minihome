# Mobile UX Refinement v2

**작성일**: 2026-04-10
**상태**: 작업 시작
**배경**: 이전 작업(`mobile-editor-improvements`)에서 1~5번 이슈를 수정했으나 실제 확인 결과 일부가 여전히 미해결 or 미흡

---

## 이슈 재정리 (사용자 피드백)

| # | 이슈 | 상태 |
|---|---|---|
| 1 | 색상 picker 여전히 겹쳐 보임 | ❌ grid-cols-4 미작동 |
| 2 | 모바일 글씨 여전히 큼 | ❌ 15px도 부족 |
| 3 | 에디터 툴바 아이콘 축소 (모바일 포함) | ❌ 모바일 여전히 큼 |
| 4 | 태그관리 아이콘 박스 중앙 정렬 | ❌ 왼쪽 치우침 |
| 5 | 커뮤니티 카테고리 탭 + 글쓰기 버튼 모바일 축소 | ❌ 여백 과다 |
| + | (추가) 텍스트 색상 버튼 자체를 더 작게 | ❌ 32px는 크다 |

---

## 근본 원인 분석

### #1 색상 picker 겹침
**Tailwind `grid grid-cols-4`의 `minmax(0, 1fr)` 함정**:
- Toolbar는 `flex flex-wrap gap-1` → 색상 버튼의 parent `<div className="relative">`가 좁은 flex item
- 그 안의 `absolute` dropdown은 containing block이 flex item이고, width가 명시 안됨
- `grid-cols-4` = `grid-template-columns: repeat(4, minmax(0, 1fr))` — **최소 0까지 축소 허용**
- parent width가 결정 안 된 상태에서 각 column이 0에 가깝게 축소됨 → 32px 버튼들이 겹침

**해결**: grid 포기 → **`flex flex-wrap` + 명시적 `w-44` (176px)**. flex는 intrinsic content width를 존중.

### #2 모바일 글씨 여전히 큼
15px도 사용자에게 부족 → **14px** + 일부 헤딩(`text-xl`)을 `text-lg`로.

### #3 툴바 아이콘
현재 `p-1.5 sm:p-1` — 모바일이 더 컸음 (접근성 우선 설계). 사용자 요청으로 **접근성 trade-off 수용**:
- `p-1 sm:p-0.5` (모바일도 축소)
- Divider `h-5 mx-0.5` → `h-4 mx-0.5` 유지
- `gap-1` → `gap-0.5`

### #4 태그관리 아이콘 왼쪽 치우침
- 버튼: `p-2 rounded-lg` + `<Icon size="md">`
- Material Symbols font-based icon은 `display: inline`이라 baseline/glyph 여백 비대칭
- 해결: **`inline-flex items-center justify-center w-10 h-10 rounded-xl p-2.5`** + Icon `size="sm"`. WriteButton 프레임과 시각적으로 일치.

### #5 커뮤니티 탭/글쓰기 여백 과다
- 카테고리 버튼: `px-4 py-2 text-sm` → **`px-2.5 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm`**
- 글쓰기 버튼: `px-4 py-2` + 아이콘 + 텍스트 → **모바일 icon-only** + 패딩 축소
- 헤더 `mb-6 pb-4` → 모바일에서 `mb-4 pb-3`

### (추가) 색상 버튼 크기
32px → **20px (`w-5 h-5`)** + `rounded` + gap 축소

---

## Phase 별 실행 계획

### Phase 1 — 색상 picker 근본 수정 + 크기 축소
**파일**: `src/components/editor/EditorToolbar.tsx`
- dropdown: `grid grid-cols-4 gap-2` → `flex flex-wrap gap-1.5 w-44`
- 버튼: `w-8 h-8 rounded-md` → `w-5 h-5 rounded`
- dropdown padding: `p-3` → `p-2.5`
- 기존 테스트 유지 (색상 16개 + aria-label 검증)

### Phase 2 — 모바일 typography 추가 축소
**파일**: `src/app/globals.css`, 주요 헤딩 컴포넌트
- `html { font-size: 14px }` (모바일), `16px` (md+)
- 헤딩 한 단계 축소:
  - PortfolioContent `text-xl sm:text-2xl` → `text-lg sm:text-2xl`
  - CommunityContent 동일
  - 기타 주요 section 헤딩도 동일 패턴

### Phase 3 — 에디터 툴바 아이콘 양방향 축소
**파일**: `src/components/editor/EditorToolbar.tsx`
- ToolbarButton: `p-1.5 sm:p-1` → `p-1 sm:p-0.5`
- ToolbarDivider: `h-5 mx-0.5` → `h-4 mx-0.5`
- 컨테이너 `gap-1 p-2` → `gap-0.5 p-1.5`
- font-size select: `h-7 px-1 text-xs` → `h-6 px-1 text-[11px]`

### Phase 4 — 태그관리 버튼 프레임 통일
**파일**: `src/components/content/PortfolioContent.tsx`
- inline flex center + w-10 h-10 + rounded-xl + Icon size sm
- WriteButton과 높이/모양 일치

### Phase 5 — 커뮤니티 카테고리 탭 + 글쓰기 버튼 축소
**파일**: `src/components/content/CommunityContent.tsx`
- 카테고리 버튼: `px-2.5 py-1 text-xs sm:px-4 sm:py-2 sm:text-sm`
- 글쓰기 버튼:
  - 패딩 `px-2.5 py-1.5 sm:px-4 sm:py-2`
  - 텍스트 `<span className="hidden sm:inline">글쓰기</span>` (모바일 icon-only)
  - Icon `size="sm"` 유지
  - aria-label="글쓰기" 필수
- 헤더 spacing: `mb-6 pb-4` → `mb-4 pb-3 sm:mb-6 sm:pb-4`

### Phase 6 — 검증
- 빌드 + Phase 관련 테스트
- 문서 이관 (target → complete)
- 커밋 & 푸시

---

## 변경 파일 목록

**수정**:
- `src/app/globals.css`
- `src/components/editor/EditorToolbar.tsx`
- `src/components/content/PortfolioContent.tsx`
- `src/components/content/CommunityContent.tsx`
- (선택) `src/components/content/CareerContent.tsx` 등 동일 헤딩 패턴

---

## 리스크 & 완화

| 리스크 | 완화 |
|---|---|
| 전역 14px가 기존 px 기반 레이아웃 깨뜨림 | 빌드 후 주요 페이지 시각 확인 |
| 색상 picker flex-wrap 전환으로 기존 테스트 깨짐 | aria-label 기반 쿼리는 DOM 구조와 무관 → OK |
| 모바일 접근성 44x44 위반 | 사용자 요청 명시적 수용, 주요 CTA는 최소 크기 유지 |
| 태그 버튼 프레임 변경 → 시각 회귀 | WriteButton과 동일 프레임으로 통일 |
