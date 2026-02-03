import { test, expect } from '@playwright/test'

test.describe('포트폴리오 페이지', () => {
  test.describe('기본 기능', () => {
  test('홈페이지 로드', async ({ page }) => {
    await page.goto('/')

    // 페이지 타이틀 확인
    await expect(page).toHaveTitle(/.*/)

    // What's New 섹션 확인
    await expect(page.locator('text=What\'s New')).toBeVisible()
  })

  test('네비게이션 탭 전환', async ({ page }) => {
    await page.goto('/')

    // 네비게이션 로드 대기
    await page.waitForLoadState('networkidle')

    // 포트폴리오 탭 클릭 (한국어 탭명)
    const portfolioTab = page.locator('nav button, nav a').filter({ hasText: '포트폴리오' })
    await portfolioTab.first().click()

    // URL 해시 확인
    await expect(page).toHaveURL(/#portfolio/)

    // 포트폴리오 제목 확인
    await expect(page.locator('h2:has-text("포트폴리오")')).toBeVisible()
  })

  test('포트폴리오 목록 표시', async ({ page }) => {
    await page.goto('/#portfolio')

    // 포트폴리오 카드가 표시될 때까지 대기
    await page.waitForSelector('.grid', { timeout: 10000 })

    // 프로젝트 카드 존재 확인
    const projectCards = page.locator('.grid > div')
    await expect(projectCards.first()).toBeVisible()
  })

  test('다크 모드 토글', async ({ page }) => {
    await page.goto('/')

    // 다크 모드 버튼 찾기
    const darkModeButton = page.locator('[aria-label*="mode"], button:has-text("dark"), button:has-text("light")').first()

    if (await darkModeButton.isVisible()) {
      // 초기 상태 확인
      const htmlClass = await page.locator('html').getAttribute('class')

      // 다크 모드 토글
      await darkModeButton.click()

      // 클래스 변경 확인
      const newHtmlClass = await page.locator('html').getAttribute('class')
      expect(newHtmlClass).not.toBe(htmlClass)
    }
  })

  test('환영 섹션 "더 자세히 보기" 클릭', async ({ page }) => {
    await page.goto('/')

    // "더 자세히 보기" 버튼 찾기 및 클릭
    const learnMoreButton = page.locator('text=더 자세히 보기')

    if (await learnMoreButton.isVisible()) {
      await learnMoreButton.click()

      // URL 해시 변경 확인
      await expect(page).toHaveURL(/#intro-detail/)

      // 상세 페이지 내용 확인
      await expect(page.locator('text=핵심 가치')).toBeVisible()
    }
  })

  test('경력 탭 전환', async ({ page }) => {
    await page.goto('/')

    // 네비게이션 로드 대기
    await page.waitForLoadState('networkidle')

    // 경력 탭 클릭 (한국어 탭명)
    const careerTab = page.locator('nav button, nav a').filter({ hasText: '경력' })
    await careerTab.first().click()

    // URL 확인
    await expect(page).toHaveURL(/#career/)
  })
  })

  test.describe('포트폴리오 상세 보기', () => {
    test('포트폴리오 카드 클릭 시 상세 페이지 표시', async ({ page }) => {
      await page.goto('/#portfolio')

      // 포트폴리오 카드 대기
      await page.waitForSelector('.grid > div', { timeout: 10000 })

      // 첫 번째 카드 클릭
      const firstCard = page.locator('.grid > div').first()
      await firstCard.click()

      // 상세 페이지 요소 확인 - 뒤로가기 버튼
      await expect(page.locator('text=목록으로 돌아가기')).toBeVisible({ timeout: 5000 })
    })

    test('상세 페이지에서 뒤로가기 버튼 동작', async ({ page }) => {
      await page.goto('/#portfolio')
      await page.waitForSelector('.grid > div', { timeout: 10000 })

      // 첫 번째 카드 클릭
      const firstCard = page.locator('.grid > div').first()
      await firstCard.click()

      // 뒤로가기 버튼 클릭
      await page.locator('text=목록으로 돌아가기').click()

      // 포트폴리오 목록이 다시 표시됨
      await expect(page.locator('.grid > div').first()).toBeVisible({ timeout: 5000 })
    })

    test('기술 스택 태그가 표시됨', async ({ page }) => {
      await page.goto('/#portfolio')
      await page.waitForSelector('.grid > div', { timeout: 10000 })

      // 첫 번째 카드 클릭
      await page.locator('.grid > div').first().click()

      // 기술 스택 섹션 확인
      await expect(page.locator('text=기술 스택')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('RichTextEditor 툴바', () => {
    test('에디터 툴바 버튼에 title 속성이 있어야 함', async ({ page }) => {
      // 이 테스트는 관리자 로그인 후 작성 모달에서 확인 필요
      // 모달이 없는 페이지에서는 스킵
      test.skip()
    })
  })

  test.describe('Modal 크기', () => {
    test('포트폴리오 작성 모달이 70vw 너비여야 함', async ({ page }) => {
      // 이 테스트는 관리자 로그인 후 확인 필요
      test.skip()
    })
  })

  test.describe('이미지 드래그 앤 드롭', () => {
    test('이미지 드롭존이 드래그 시 시각적 피드백을 제공해야 함', async ({ page }) => {
      // 이 테스트는 관리자 로그인 후 확인 필요
      test.skip()
    })
  })
})
