# UI Adjustment Plan (Round 3)

## Decisions Summary

| # | Section | Issue | Decision |
|---|---------|-------|----------|
| A-1 | Architecture | Community 글쓰기 버튼 위치 | actionSlot 제거, 카테고리 탭 행에 직접 배치 |
| A-2 | Architecture | Diary 페이지네이션 기준 | DIARY_PAGE_SIZE = 3 (3개 초과 시 페이지네이션) |
| A-3 | Architecture | 공지사항 중앙 배치 | 이중 spacer (flex-1) 방식 |
| CQ-1 | Code Quality | actionSlot 정리 | 4파일 완전 정리 |
| CQ-2 | Code Quality | AnnouncementBanner border-t | 제거 (중앙 배치 시 불필요) |
| CQ-3 | Code Quality | VisitorCounter mt-auto | 제거 (spacer가 대신) |

---

## Task 1: 글쓰기 버튼 → 카테고리 탭 행 우측

### Phase 1-1: PostList에서 actionSlot 제거

**Test:** `src/components/community/PostList.test.tsx`
- `PostList actionSlot` describe 블록 전체 제거 (L60-101)

**Implementation:** `src/components/community/PostList.tsx`
- `PostListProps`에서 `actionSlot` 제거
- destructuring에서 `actionSlot` 제거
- actionSlot JSX 블록 (L115-119) 제거

### Phase 1-2: CommunityContent에서 카테고리 행에 글쓰기 버튼 배치

**Test:** `src/components/content/CommunityContent.test.tsx`
- PostList mock에서 actionSlot 처리 제거
- 글쓰기 버튼이 카테고리 탭 행에 있는지 확인하는 테스트로 변경

**Implementation:** `src/components/content/CommunityContent.tsx`
- PostList에서 actionSlot prop 제거
- 카테고리 탭 `<div>` 를 `flex justify-between`으로 변경
- 카테고리 버튼들을 왼쪽 그룹, 글쓰기 버튼을 오른쪽에 배치:
```tsx
<div className="flex items-center justify-between mb-6 border-b ... pb-4">
  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
    {categories.map(...)}
  </div>
  <button onClick={handleWriteClick} className="...">
    <Icon name="edit_note" ... />
    글쓰기
  </button>
</div>
```

**Files:**
- `src/components/community/PostList.tsx` (edit: actionSlot 제거)
- `src/components/community/PostList.test.tsx` (edit: actionSlot 테스트 제거)
- `src/components/content/CommunityContent.tsx` (edit: 버튼 위치 변경)
- `src/components/content/CommunityContent.test.tsx` (edit: 테스트 업데이트)

---

## Task 2: Diary 페이지네이션 기준 변경

### Phase 2-1: DIARY_PAGE_SIZE 변경 (TDD)

**Test:** `src/components/content/DiaryContent.test.tsx`
- 기존 테스트 수정: 4개 → 3개 기준
  - "4개 항목이 있을 때 1페이지에 3개만 표시해야 함"
  - "3개 이하일 때 Pagination이 렌더링되지 않아야 함"
  - "2페이지로 이동하면 4번째 항목이 표시되어야 함"

**Implementation:** `src/components/content/DiaryContent.tsx`
- `DIARY_PAGE_SIZE = 4` → `DIARY_PAGE_SIZE = 3`

**Files:**
- `src/components/content/DiaryContent.tsx` (edit: 상수 변경)
- `src/components/content/DiaryContent.test.tsx` (edit: 테스트 기준값 수정)

---

## Task 3: 공지사항 중앙 배치

### Phase 3-1: Sidebar 이중 spacer + AnnouncementBanner border-t 제거

**Test:** `src/components/sidebar/AnnouncementBanner.test.tsx`
- `pt-4` 테스트 수정 (border-t 제거 후 변경된 클래스명 반영)

**Test:** `src/components/sidebar/VisitorCounter.test.tsx`
- `mt-auto` 관련 테스트가 있으면 수정

**Implementation:**
1. `src/components/sidebar/Sidebar.tsx`
   - AnnouncementBanner 앞뒤에 `<div className="flex-1" />` spacer 추가

2. `src/components/sidebar/AnnouncementBanner.tsx`
   - 3곳의 `pt-4 border-t` → border-t 제거 (pt-4 유지 또는 제거)

3. `src/components/sidebar/VisitorCounter.tsx`
   - `mt-auto` 제거 (pt-6 border-t 유지)

**Files:**
- `src/components/sidebar/Sidebar.tsx` (edit: spacer 추가)
- `src/components/sidebar/AnnouncementBanner.tsx` (edit: border-t 제거)
- `src/components/sidebar/AnnouncementBanner.test.tsx` (edit: 테스트 수정)
- `src/components/sidebar/VisitorCounter.tsx` (edit: mt-auto 제거)

---

## Implementation Order

1. **Task 2** (가장 간단 — 상수 1개 변경 + 테스트 수정)
2. **Task 1** (4파일 수정 — actionSlot 제거 + 카테고리 행 배치)
3. **Task 3** (3파일 수정 — Sidebar 구조 변경)
