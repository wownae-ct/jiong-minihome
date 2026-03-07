/**
 * 포트폴리오 대표 이미지 파싱/직렬화 유틸리티
 *
 * DB에는 단일 URL 문자열 또는 JSON 배열 문자열로 저장됩니다.
 * - 기존 데이터: "https://example.com/image.jpg"
 * - 신규 데이터(2개): '["https://a.jpg","https://b.jpg"]'
 */

export function parsePortfolioImages(image: string | null | undefined): string[] {
  if (!image) return []

  if (image.startsWith('[')) {
    try {
      const parsed = JSON.parse(image)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // JSON 파싱 실패 시 원본 문자열을 배열로 감싸 반환
    }
  }

  return [image]
}

export function serializePortfolioImages(images: string[]): string | null {
  if (images.length === 0) return null
  if (images.length === 1) return images[0]
  return JSON.stringify(images)
}

export function getFirstImage(image: string | null | undefined): string | null {
  const images = parsePortfolioImages(image)
  return images[0] ?? null
}
