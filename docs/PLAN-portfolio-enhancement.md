# 포트폴리오 기능 개선 구현 계획

## 요구사항 정리

### 1. 기술 스택 태그 관리 기능
- 포트폴리오 페이지에서 태그를 직접 추가/삭제할 수 있는 기능

### 2. 포트폴리오 글쓰기 기능 (노션 스타일 에디터)
- 기존 수정 기능을 글쓰기 기능으로 변경
- 모달 형태의 글쓰기 폼
- 노션 UI/UX 참고한 텍스트 에디터 구현:
  - 사진 첨부
  - 코드 블록
  - 텍스트 색상 변경
  - 텍스트 기울이기 (이탤릭)
  - 글머리 기호
  - 번호 매기기 목록
  - 헤딩 설정

### 3. 포트폴리오 상세 보기 수정
- DB에서 조회한 콘텐츠 표시
- GitHub 링크 유지
- Notion에서 보기 링크 추가
- 데모 보기 제거

### 4. Header.tsx Link 문제 수정
- 클릭 시 탭과 콘텐츠가 변경되지 않는 문제 해결
- 아이콘 크기 증가

### 5. 전체 기능 및 페이지 점검

---

## Phase 1: 데이터베이스 스키마 변경

### 1.1 Portfolio 테이블 신규 생성
현재 포트폴리오 데이터는 `SiteSetting` 테이블에 JSON으로 저장되어 있습니다.
독립적인 `Portfolio` 테이블을 생성하여 더 나은 데이터 관리를 지원합니다.

**파일**: `prisma/schema.prisma`

```prisma
model Portfolio {
  id          Int       @id @default(autoincrement()) @db.UnsignedInt
  userId      Int       @map("user_id") @db.UnsignedInt
  title       String    @db.VarChar(200)
  content     String    @db.MediumText  // 리치 텍스트 콘텐츠 (JSON)
  description String?   @db.Text        // 간단 설명
  image       String?   @db.VarChar(500) // 대표 이미지
  githubUrl   String?   @map("github_url") @db.VarChar(500)
  notionUrl   String?   @map("notion_url") @db.VarChar(500)
  featured    Boolean?  @default(false)
  isDeleted   Boolean?  @default(false) @map("is_deleted")
  sortOrder   Int?      @default(0) @map("sort_order")
  createdAt   DateTime? @default(now()) @map("created_at") @db.DateTime(0)
  updatedAt   DateTime? @default(now()) @updatedAt @map("updated_at") @db.DateTime(0)

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tags        PortfolioTag[]

  @@index([userId], map: "idx_portfolio_user")
  @@index([createdAt], map: "idx_portfolio_created")
  @@map("portfolios")
}

model Tag {
  id        Int       @id @default(autoincrement()) @db.UnsignedInt
  name      String    @unique @db.VarChar(50)
  color     String?   @db.VarChar(20) // 태그 색상 (hex 또는 preset)
  createdAt DateTime? @default(now()) @map("created_at") @db.DateTime(0)

  portfolios PortfolioTag[]

  @@map("tags")
}

model PortfolioTag {
  portfolioId Int       @map("portfolio_id") @db.UnsignedInt
  tagId       Int       @map("tag_id") @db.UnsignedInt

  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  tag         Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([portfolioId, tagId])
  @@map("portfolio_tags")
}
```

### 1.2 User 모델에 관계 추가
```prisma
model User {
  // ... 기존 필드
  portfolios Portfolio[]
}
```

**복잡도**: 중간
**위험**: 낮음 (새 테이블 추가, 기존 데이터 마이그레이션 필요)

---

## Phase 2: 노션 스타일 리치 텍스트 에디터 구현

### 2.1 에디터 라이브러리 선택: Tiptap

**선택 이유**:
- 노션 스타일 UI/UX 구현에 최적화
- 확장성이 뛰어남 (커스텀 노드, 마크 추가 가능)
- React 지원이 우수함
- 헤드리스 디자인으로 완전한 UI 커스터마이징 가능

**설치할 패키지**:
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-color @tiptap/extension-text-style
npm install @tiptap/extension-image @tiptap/extension-code-block-lowlight
npm install @tiptap/extension-placeholder
npm install lowlight  # 코드 하이라이팅용
```

### 2.2 에디터 컴포넌트 구조

**파일 구조**:
```
src/components/editor/
├── RichTextEditor.tsx          # 메인 에디터 컴포넌트
├── RichTextEditor.test.tsx     # 에디터 테스트
├── EditorToolbar.tsx           # 툴바 컴포넌트
├── EditorBubbleMenu.tsx        # 선택 시 나타나는 버블 메뉴
├── SlashCommandMenu.tsx        # / 명령어 메뉴 (노션 스타일)
├── ImageUploadNode.tsx         # 이미지 업로드 노드
├── CodeBlockNode.tsx           # 코드 블록 노드
└── index.ts                    # 내보내기
```

### 2.3 에디터 기능 명세

| 기능 | 단축키 | 구현 방식 |
|------|--------|----------|
| 헤딩 1-3 | Ctrl+Alt+1~3 | Tiptap Heading 확장 |
| 굵게 | Ctrl+B | Tiptap Bold 확장 |
| 기울임 | Ctrl+I | Tiptap Italic 확장 |
| 취소선 | Ctrl+Shift+S | Tiptap Strike 확장 |
| 텍스트 색상 | - | Tiptap TextStyle + Color 확장 |
| 글머리 기호 | - | Tiptap BulletList 확장 |
| 번호 목록 | - | Tiptap OrderedList 확장 |
| 코드 블록 | ``` 또는 /code | CodeBlockLowlight 확장 |
| 이미지 삽입 | /image 또는 드래그앤드롭 | Image 확장 + 업로드 API |
| 인용문 | > 또는 /quote | Blockquote 확장 |
| 구분선 | --- 또는 /divider | HorizontalRule 확장 |

### 2.4 슬래시 커맨드 메뉴 (노션 스타일)

```typescript
const slashCommands = [
  { name: '헤딩 1', icon: 'format_h1', command: 'heading1' },
  { name: '헤딩 2', icon: 'format_h2', command: 'heading2' },
  { name: '헤딩 3', icon: 'format_h3', command: 'heading3' },
  { name: '글머리 기호', icon: 'format_list_bulleted', command: 'bulletList' },
  { name: '번호 목록', icon: 'format_list_numbered', command: 'orderedList' },
  { name: '코드 블록', icon: 'code', command: 'codeBlock' },
  { name: '이미지', icon: 'image', command: 'image' },
  { name: '인용문', icon: 'format_quote', command: 'blockquote' },
  { name: '구분선', icon: 'horizontal_rule', command: 'horizontalRule' },
]
```

**복잡도**: 높음
**위험**: 중간 (새로운 라이브러리 도입)

---

## Phase 3: 포트폴리오 글쓰기 모달 구현

### 3.1 모달 컴포넌트 수정

**파일**: `src/components/admin/PortfolioWriteModal.tsx` (신규)

기존 `PortfolioEditModal.tsx`를 기반으로 리치 텍스트 에디터를 통합한 새 모달 생성.

```typescript
interface PortfolioWriteModalProps {
  isOpen: boolean
  onClose: () => void
  portfolio?: Portfolio | null  // 수정 시 기존 데이터
  onSuccess?: () => void
}
```

### 3.2 폼 필드 구성

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | Input | O | 프로젝트 제목 |
| description | Textarea | X | 간단 설명 (목록에 표시) |
| content | RichTextEditor | O | 상세 내용 (노션 스타일) |
| image | ImageUpload | X | 대표 이미지 |
| tags | TagInput | X | 기술 스택 태그 |
| githubUrl | Input | X | GitHub 링크 |
| notionUrl | Input | X | Notion 링크 |
| featured | Checkbox | X | 주요 프로젝트 여부 |

### 3.3 태그 입력 컴포넌트

**파일**: `src/components/ui/TagInput.tsx`

```typescript
interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]  // 자동완성 제안
  maxTags?: number
  placeholder?: string
}
```

**기능**:
- 태그 추가 (Enter 또는 쉼표로 구분)
- 태그 삭제 (X 버튼 또는 Backspace)
- 자동완성 (기존 태그 제안)
- 드래그앤드롭으로 순서 변경 (선택사항)

**복잡도**: 중간
**위험**: 낮음

---

## Phase 4: API 엔드포인트 구현

### 4.1 포트폴리오 API

**파일**: `src/app/api/portfolios/route.ts`

```typescript
// GET: 포트폴리오 목록 조회
GET /api/portfolios
Response: { data: Portfolio[], total: number }

// POST: 포트폴리오 생성 (관리자 전용)
POST /api/portfolios
Body: { title, content, description, image, githubUrl, notionUrl, tags[], featured }
Response: { data: Portfolio }
```

**파일**: `src/app/api/portfolios/[id]/route.ts`

```typescript
// GET: 포트폴리오 상세 조회
GET /api/portfolios/:id
Response: { data: Portfolio }

// PUT: 포트폴리오 수정 (관리자 전용)
PUT /api/portfolios/:id
Body: { title, content, description, ... }
Response: { data: Portfolio }

// DELETE: 포트폴리오 삭제 (관리자 전용)
DELETE /api/portfolios/:id
Response: { success: true }
```

### 4.2 태그 API

**파일**: `src/app/api/tags/route.ts`

```typescript
// GET: 모든 태그 조회
GET /api/tags
Response: { data: Tag[] }

// POST: 태그 생성 (관리자 전용)
POST /api/tags
Body: { name, color? }
Response: { data: Tag }
```

**파일**: `src/app/api/tags/[id]/route.ts`

```typescript
// DELETE: 태그 삭제 (관리자 전용)
DELETE /api/tags/:id
Response: { success: true }
```

**복잡도**: 중간
**위험**: 낮음

---

## Phase 5: 포트폴리오 상세 보기 수정

### 5.1 PortfolioDetail 컴포넌트 수정

**파일**: `src/components/content/PortfolioDetail.tsx`

**변경 사항**:
1. DB에서 조회한 리치 텍스트 콘텐츠 렌더링
2. demoUrl 필드 및 데모 링크 버튼 제거
3. notionUrl 필드 및 Notion 링크 버튼 추가

```typescript
// 링크 섹션 (변경 전)
<Button href={project.demoUrl}>데모 보기</Button>
<Button href={project.githubUrl}>GitHub</Button>

// 링크 섹션 (변경 후)
<Button href={project.githubUrl}>
  <Icon name="code" /> GitHub
</Button>
<Button href={project.notionUrl}>
  <Icon name="description" /> Notion에서 보기
</Button>
```

### 5.2 리치 텍스트 렌더러

**파일**: `src/components/editor/RichTextRenderer.tsx`

Tiptap에서 생성된 JSON 콘텐츠를 읽기 전용으로 렌더링하는 컴포넌트.

```typescript
interface RichTextRendererProps {
  content: JSONContent | string
  className?: string
}
```

**복잡도**: 낮음
**위험**: 낮음

---

## Phase 6: Header.tsx Link 문제 수정

### 6.1 문제 분석

**현재 코드**:
```typescript
<Link href="/" className="...">
  지옹이 미니홈피
  <Icon name="home" className="text-primary" />
</Link>
```

**문제 원인**:
- 이미 `/` 페이지에 있을 때 Link 클릭 시 `hashchange` 이벤트가 발생하지 않음
- TabContext 상태가 업데이트되지 않아 콘텐츠 변경 안 됨

### 6.2 해결 방법

**방법 1**: Link를 버튼으로 변경하고 TabContext 직접 조작

```typescript
'use client'

import { useTab } from '@/components/providers/TabContext'

export function Header() {
  const { setActiveTab } = useTab()

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setActiveTab('intro')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <a
      href="/"
      onClick={handleLogoClick}
      className="..."
    >
      지옹이 미니홈피
      <Icon name="home" className="text-primary" size="xl" /> {/* 크기 증가 */}
    </a>
  )
}
```

### 6.3 아이콘 크기 조정

현재 Icon 크기: `size` prop 미지정 (기본값)
변경: `size="xl"` 또는 `size="2xl"`

```typescript
// Icon.tsx의 크기 정의 확인 후 적절한 크기 선택
<Icon name="home" className="text-primary" size="xl" />
```

**복잡도**: 낮음
**위험**: 낮음

---

## Phase 7: 기존 데이터 마이그레이션

### 7.1 마이그레이션 스크립트

**파일**: `scripts/migrate-portfolios.ts`

SiteSetting에 저장된 기존 포트폴리오 데이터를 새 Portfolio 테이블로 이전.

```typescript
async function migratePortfolios() {
  // 1. SiteSetting에서 기존 데이터 조회
  const setting = await prisma.siteSetting.findUnique({
    where: { settingKey: 'admin_content_portfolios' }
  })

  // 2. JSON 파싱
  const oldPortfolios = JSON.parse(setting.settingValue)

  // 3. 새 테이블에 데이터 삽입
  for (const portfolio of oldPortfolios) {
    // 태그 처리
    const tags = await createOrFindTags(portfolio.tags)

    // 포트폴리오 생성
    await prisma.portfolio.create({
      data: {
        title: portfolio.title,
        description: portfolio.description,
        content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: portfolio.description }] }] }),
        image: portfolio.image,
        githubUrl: portfolio.githubUrl,
        notionUrl: null,  // 새 필드
        featured: portfolio.featured,
        userId: 1,  // 관리자 ID
        tags: {
          create: tags.map(tag => ({ tagId: tag.id }))
        }
      }
    })
  }
}
```

**복잡도**: 중간
**위험**: 중간 (데이터 손실 방지를 위해 백업 필수)

---

## Phase 8: 테스트 작성 (TDD)

### 8.1 테스트 파일 목록

```
src/components/editor/RichTextEditor.test.tsx
src/components/editor/TagInput.test.tsx
src/components/admin/PortfolioWriteModal.test.tsx
src/components/content/PortfolioDetail.test.tsx
src/components/layout/Header.test.tsx
src/app/api/portfolios/route.test.ts
src/app/api/tags/route.test.ts
src/hooks/usePortfolios.test.ts
```

### 8.2 테스트 우선순위

1. **높음**: API 엔드포인트 테스트
2. **높음**: 포트폴리오 글쓰기 모달 테스트
3. **중간**: 리치 텍스트 에디터 테스트
4. **중간**: Header Link 동작 테스트
5. **낮음**: 태그 입력 컴포넌트 테스트

---

## Phase 9: 전체 점검

### 9.1 기능 점검 체크리스트

- [ ] 포트폴리오 목록 조회
- [ ] 포트폴리오 글쓰기 (모달)
- [ ] 포트폴리오 수정
- [ ] 포트폴리오 삭제
- [ ] 포트폴리오 상세 보기
- [ ] 태그 추가/삭제
- [ ] 태그 필터링
- [ ] 이미지 업로드
- [ ] 리치 텍스트 에디터 기능
- [ ] Header 로고 클릭
- [ ] 다크모드 지원
- [ ] 모바일 반응형

### 9.2 E2E 테스트

Playwright를 사용한 E2E 테스트 작성:
- 포트폴리오 CRUD 플로우
- 글쓰기 모달 UX
- 에디터 기능 검증

---

## 구현 순서 (권장)

### Step 1: 기초 작업
1. Prisma 스키마 변경 및 마이그레이션
2. Tiptap 패키지 설치
3. API 테스트 작성

### Step 2: 백엔드
4. Portfolio API 구현
5. Tag API 구현
6. API 테스트 통과 확인

### Step 3: 에디터
7. RichTextEditor 컴포넌트 구현
8. TagInput 컴포넌트 구현
9. 에디터 테스트 작성

### Step 4: UI
10. PortfolioWriteModal 구현
11. PortfolioDetail 수정
12. Header.tsx 수정

### Step 5: 마무리
13. 데이터 마이그레이션
14. 전체 기능 점검
15. E2E 테스트

---

## 위험 요소

| 위험 | 영향 | 대응 |
|------|------|------|
| Tiptap 학습 곡선 | 중간 | 공식 문서 및 예제 참고 |
| 데이터 마이그레이션 실패 | 높음 | 백업 후 진행, 롤백 계획 |
| 에디터 성능 이슈 | 낮음 | 지연 로딩, 메모이제이션 적용 |
| 이미지 업로드 크기 제한 | 낮음 | 클라이언트 측 압축 또는 제한 안내 |

---

## 예상 작업량

| Phase | 예상 복잡도 |
|-------|-----------|
| Phase 1: DB 스키마 | 중간 |
| Phase 2: 에디터 구현 | 높음 |
| Phase 3: 글쓰기 모달 | 중간 |
| Phase 4: API | 중간 |
| Phase 5: 상세 보기 | 낮음 |
| Phase 6: Header 수정 | 낮음 |
| Phase 7: 마이그레이션 | 중간 |
| Phase 8: 테스트 | 중간 |
| Phase 9: 점검 | 낮음 |

---

**확인 필요 사항**:
1. 노션 링크(notionUrl) 필드 추가가 맞는지 확인
2. demoUrl 필드를 완전히 제거할지, 숨기기만 할지 확인
3. 기존 포트폴리오 데이터 마이그레이션 시 content 필드 변환 방식 확인
4. 태그 색상 기능이 필요한지 확인
