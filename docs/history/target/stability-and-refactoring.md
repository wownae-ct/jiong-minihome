# 안정성 개선 + 리팩토링 + 방명록 UI 수정 계획

## 개요

- **Task 1**: 탭 네비게이션 안정성 버그 수정 (welcome CTA → 탭 전환 실패)
- **Task 2**: 구조적 리팩토링 (TabContext 분리 등)
- **Task 3**: 방명록 엔트리 간격 수정
- **방향**: B — 근본적 구조 개선 접근
- **제약**: 커밋/푸시 금지, TDD 방식 (테스트 먼저)

---

## Task 1 — 안정성 버그 근본 원인

### 현상
`WelcomeSection` → "더 자세히 보기" → `WelcomeDetail` → "포트폴리오 보기"/"경력 보기" 클릭 후, 다른 탭을 터치해도 내용이 렌더링되지 않음 (간헐적).

### 근본 원인: Nested `AnimatePresence mode="wait"` 레이스 컨디션

두 겹의 `AnimatePresence mode="wait"`가 동시에 동작하며 framer-motion의 exit 애니메이션 lifecycle이 잠김.

**1. 바깥층** — [TabContent.tsx:77](src/components/content/TabContent.tsx#L77)
```tsx
<AnimatePresence mode="wait">
  <motion.div key={activeTab}>...</motion.div>
</AnimatePresence>
```

**2. 안쪽층** — [WhatsNew.tsx:40-45](src/components/content/WhatsNew.tsx#L40-L45)
```tsx
if (welcomeDetailOpen) {
  return (
    <AnimatePresence mode="wait">
      <WelcomeDetail key="welcome-detail" />  {/* motion.div with exit props */}
    </AnimatePresence>
  )
}
```

**3. 트리거** — [TabContext.tsx:158-169](src/components/providers/TabContext.tsx#L158-L169)
```tsx
const setActiveTab = useCallback((tab: TabId) => {
  setActiveTabState(tab)           // intro → career
  setWelcomeDetailOpenState(false) // true → false
  // 두 상태 변경이 같은 배치에서 처리됨
}, [])
```

### 충돌 시퀀스

1. 사용자가 "경력 보기" 클릭 → `setActiveTab('career')` 호출
2. 같은 렌더 배치에서:
   - 바깥 `AnimatePresence`: `key="intro"` → `key="career"` 교체 시작 → **intro의 exit 대기**
   - 안쪽 `AnimatePresence`: `welcomeDetailOpen` false → **WelcomeDetail의 exit 실행**
3. 바깥 exit이 `WhatsNew` 언마운트를 시도하지만, 안쪽 `AnimatePresence`가 아직 `WelcomeDetail`의 exit 애니메이션을 실행 중
4. framer-motion의 내부 onExitComplete callback이 nested 구조에서 호출되지 않거나 순서가 꼬임
5. 바깥 `AnimatePresence`가 "exit 진행 중"으로 잠김 → 새 탭 `career` 마운트 차단
6. 이후 탭 클릭 시에도 `activeTab`만 바뀌고 DOM은 업데이트되지 않는 **좀비 상태**

### 수정 전략

**핵심**: 안쪽 `AnimatePresence`를 제거하고, welcome detail을 탭 전환과 분리된 상태로 관리.

**선택한 접근**: `welcomeDetailOpen`을 `activeTab`의 서브 상태로 보는 대신, **독립된 라우트**처럼 취급.

구체적으로:
1. [WhatsNew.tsx](src/components/content/WhatsNew.tsx)에서 내부 `AnimatePresence` 제거
2. `WelcomeDetail`을 바깥 `AnimatePresence`의 직계 자식으로 노출 (별도 "가상 탭" 취급)
3. `TabContent.tsx`에서 `activeTab === 'intro' && welcomeDetailOpen`일 때 `WelcomeDetail`을 렌더 (key를 `"intro-detail"`로 구분)
4. 바깥 `AnimatePresence`가 single source of truth가 되어 충돌 제거

---

## Task 2 — 리팩토링 (B 방향)

### R1. TabContext 분리 (God Object 해결)

**현재**: 단일 Context에서 5가지 상태 관리 → 모든 consumer가 불필요하게 리렌더링

**개선안**: 역할별 분리
```
TabProvider (composing root)
├── NavigationContext    { activeTab, setActiveTab }
├── PortfolioViewContext { detailId, setDetail }
├── CommunityViewContext { postId, category, setCommunityPost }
└── WelcomeViewContext   { detailOpen, setDetail }
```

**이점**:
- `setActiveTab` 호출이 한 컨텍스트만 업데이트 → 다른 consumer 리렌더링 없음
- Task 1의 "상태 동시 변경"도 각 컨텍스트로 자연스럽게 분산됨
- URL 파싱/popstate 로직은 상위 `TabProvider`가 여전히 orchestrate

**마이그레이션**: `useTab()` 훅은 유지하되, 내부적으로 여러 컨텍스트를 조합하여 backwards-compatible 하게 제공 (1단계). 추후 consumer를 세분화된 훅(`useNavigation`, `useWelcomeView` 등)으로 이관 (2단계). 이 계획에서는 **1단계까지만** 수행.

### R2. CommunityContent 상태 중복 제거

**현재**: [CommunityContent.tsx:47-49](src/components/content/CommunityContent.tsx#L47-L49)에서 `viewMode`, `selectedPostId` 로컬 상태가 `communityPostId`를 `useEffect`로 동기화

**개선안**: 파생 상태를 컨텍스트에서 직접 계산
```tsx
const { communityPostId } = useCommunityView()
const viewMode = communityPostId ? 'detail' : 'list'
```

### R3. `goBack()` 제거 → 명시적 상태 전환

**현재**: [TabContext.tsx:213-215](src/components/providers/TabContext.tsx#L213-L215)
```tsx
const goBack = useCallback(() => {
  window.history.back()
}, [])
```

**문제**: 직접 URL 진입 시 앱 외부로 나갈 수 있음

**개선안**: `WelcomeDetail`의 뒤로가기를 `setWelcomeDetail(false)`로 교체. 포트폴리오/커뮤니티 상세뷰도 동일 패턴.

### R4~R6 (보류)

사용자에게 확인 받은 R1~R3 외에는 **이번 작업에 포함하지 않음**. R4(ErrorBoundary 자동 리셋), R5(CareerContent react-query), R6(하드코딩 이미지 URL)은 별도 PR로 분리.

---

## Task 3 — 방명록 엔트리 간격 수정

### 현상
엔트리 간 구분선 바로 아래에 다음 엔트리 내용이 붙음 → 답답함

### 원인
- [GuestbookEntry.tsx:81](src/components/guestbook/GuestbookEntry.tsx#L81): `pb-3 sm:pb-4` (아래쪽 패딩만)
- [GuestbookList.tsx:73](src/components/guestbook/GuestbookList.tsx#L73): `space-y-0` (엔트리 간 간격 없음)

### 수정
```diff
- <div className="border-b border-slate-100 dark:border-slate-700 pb-3 sm:pb-4 last:border-b-0 last:pb-0">
+ <div className="border-b border-slate-100 dark:border-slate-700 pt-3 sm:pt-4 pb-3 sm:pb-4 first:pt-0 last:border-b-0 last:pb-0">
```

상하 대칭적 패딩으로 구분선 중앙에 여백 확보. 첫 엔트리는 `first:pt-0`로 상단 여백 제거 (폼과의 간격은 리스트의 `space-y-3 sm:space-y-5`가 담당).

---

## 구현 순서 (Phase별)

### Phase 1 — 테스트 작성 (TDD)

**목표**: 수정 전에 실패하는 테스트 먼저 작성

- [ ] `TabContext.test.tsx` — `setActiveTab` 호출 시 welcome detail과 탭이 동시에 올바르게 변경되는지
- [ ] `TabContent.test.tsx` — welcome detail → 다른 탭 전환 시 새 탭 content가 렌더링되는지 (regression)
- [ ] `WhatsNew.test.tsx` — welcomeDetailOpen이 true일 때 WelcomeDetail, false일 때 기본 content 렌더
- [ ] `GuestbookEntry.test.tsx` — 상단/하단 패딩 클래스 존재 확인

모두 실패 상태여야 함 (Red).

### Phase 2 — Task 1 수정 (안정성 버그)

1. **[WhatsNew.tsx](src/components/content/WhatsNew.tsx)** — 내부 `AnimatePresence` 제거, welcomeDetailOpen 분기도 제거
2. **[TabContent.tsx](src/components/content/TabContent.tsx)** — `activeTab === 'intro' && welcomeDetailOpen`일 때 `<WelcomeDetail key="intro-detail" />` 렌더, 그 외 `<WhatsNew key="intro" />` 렌더 (같은 바깥 AnimatePresence 안에서)
3. **[WelcomeDetail.tsx](src/components/content/WelcomeDetail.tsx)** — `motion.div` exit props 유지 (바깥 AnimatePresence가 관리)
4. **[TabContext.tsx](src/components/providers/TabContext.tsx)** — `setActiveTab`에서 `setWelcomeDetailOpenState(false)`는 유지 (이제 안전함, 단일 AnimatePresence 레이어)

→ 테스트 통과 확인 (Green)

### Phase 3 — Task 2 리팩토링 (R1: TabContext 분리)

1. **새 파일 생성** — `src/components/providers/contexts/`
   - `NavigationContext.tsx` (activeTab)
   - `PortfolioViewContext.tsx` (portfolioDetailId)
   - `CommunityViewContext.tsx` (communityPostId, communityCategory)
   - `WelcomeViewContext.tsx` (welcomeDetailOpen)
2. **[TabContext.tsx](src/components/providers/TabContext.tsx) 재구성** — `TabProvider`를 composition root로, 내부에 4개 Provider를 중첩. URL 파싱/popstate 로직은 `TabProvider`가 담당하고 `useEffect`로 각 context의 setter 호출
3. **`useTab()` 훅 유지** — 내부적으로 `useContext` 4번 호출해서 합쳐 반환 (backwards compat)
4. **테스트** — 기존 consumer 테스트가 여전히 통과하는지 확인

### Phase 4 — Task 2 리팩토링 (R2, R3)

1. **[CommunityContent.tsx](src/components/content/CommunityContent.tsx)** — `viewMode`/`selectedPostId` 로컬 상태 제거, `communityPostId`에서 직접 파생
2. **`goBack` 제거** — [TabContext.tsx](src/components/providers/TabContext.tsx)에서 함수 제거. [WelcomeDetail.tsx](src/components/content/WelcomeDetail.tsx)의 호출부를 `setWelcomeDetail(false)`로 교체. 포트폴리오/커뮤니티 상세뷰 호출부도 동일 패턴으로 교체
3. **테스트** — 상세 → 리스트 복귀가 동작하는지

### Phase 5 — Task 3 방명록 간격 수정

1. **[GuestbookEntry.tsx](src/components/guestbook/GuestbookEntry.tsx)** — 루트 div 클래스 변경 (`pt-3 sm:pt-4 first:pt-0` 추가)
2. 테스트 통과 확인

### Phase 6 — 검증

- [ ] `npm run lint` 통과
- [ ] `npx vitest run` 전체 테스트 통과
- [ ] `npm run build` 성공
- [ ] 수동 시나리오 테스트 (문서화):
  - welcome → 경력 보기 → 포트폴리오 탭 클릭 → 정상 렌더
  - welcome → 포트폴리오 보기 → 다이어리 탭 → 정상 렌더
  - welcome → 경력 보기 → 다시 인트로 → 다시 커뮤니티 → 정상 렌더
  - 방명록 목록 시각적 간격 확인

---

## 리스크 및 완화

| 리스크 | 완화 |
|--------|------|
| TabContext 분리 시 consumer 깨짐 | `useTab()` 훅 backwards-compat 유지, 기존 테스트 먼저 통과시킨 후 작업 |
| AnimatePresence 수정이 exit 애니메이션 망가뜨림 | WelcomeDetail/WhatsNew 모두 같은 outer AnimatePresence 하위로 이동 — exit props 보존 |
| popstate 브라우저 뒤로가기 회귀 | URL 파싱 로직은 그대로 유지, setter만 분산 |
| 방명록 first:pt-0가 Skeleton 상태에서 이상하게 보임 | SkeletonPost도 GuestbookList에서 렌더되므로 실제 시각 확인 필요 |

---

## 복잡도 추정

- **Phase 1 (테스트)**: Low
- **Phase 2 (안정성)**: Medium — framer-motion 동작 검증 필수
- **Phase 3 (Context 분리)**: Medium — 여러 파일 수정
- **Phase 4 (R2, R3)**: Low
- **Phase 5 (방명록)**: Low
- **Phase 6 (검증)**: Low

**전체**: Medium

---

## 확인 필요 사항

1. 위 Phase 구성 및 우선순위로 진행해도 괜찮은지
2. R1의 TabContext 분리를 **1단계(backwards-compat)까지만** 하고, 세분화 훅 이관(2단계)은 별도 작업으로 미루는 것이 맞는지
3. R4~R6은 이번 스코프 제외가 맞는지

확인되면 Phase 1부터 진행하겠습니다.
