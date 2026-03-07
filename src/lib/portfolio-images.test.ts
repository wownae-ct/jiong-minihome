import { parsePortfolioImages, serializePortfolioImages, getFirstImage } from './portfolio-images'

describe('parsePortfolioImages', () => {
  it('null을 빈 배열로 반환', () => {
    expect(parsePortfolioImages(null)).toEqual([])
  })

  it('undefined를 빈 배열로 반환', () => {
    expect(parsePortfolioImages(undefined)).toEqual([])
  })

  it('빈 문자열을 빈 배열로 반환', () => {
    expect(parsePortfolioImages('')).toEqual([])
  })

  it('단일 URL 문자열을 배열로 반환 (하위 호환)', () => {
    const url = 'https://example.com/image.jpg'
    expect(parsePortfolioImages(url)).toEqual([url])
  })

  it('JSON 배열 문자열을 파싱', () => {
    const urls = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
    expect(parsePortfolioImages(JSON.stringify(urls))).toEqual(urls)
  })

  it('JSON 배열이지만 1개만 있는 경우', () => {
    const urls = ['https://example.com/img1.jpg']
    expect(parsePortfolioImages(JSON.stringify(urls))).toEqual(urls)
  })

  it('잘못된 JSON은 원본 문자열을 배열로 감싸 반환', () => {
    const url = 'https://example.com/image.jpg'
    expect(parsePortfolioImages('[invalid')).toEqual(['[invalid'])
  })
})

describe('serializePortfolioImages', () => {
  it('빈 배열을 null로 반환', () => {
    expect(serializePortfolioImages([])).toBeNull()
  })

  it('1개 이미지는 단일 URL 문자열로 반환', () => {
    const url = 'https://example.com/image.jpg'
    expect(serializePortfolioImages([url])).toBe(url)
  })

  it('2개 이미지는 JSON 배열 문자열로 반환', () => {
    const urls = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
    expect(serializePortfolioImages(urls)).toBe(JSON.stringify(urls))
  })
})

describe('getFirstImage', () => {
  it('null이면 null 반환', () => {
    expect(getFirstImage(null)).toBeNull()
  })

  it('단일 URL에서 첫 번째 이미지 반환', () => {
    const url = 'https://example.com/image.jpg'
    expect(getFirstImage(url)).toBe(url)
  })

  it('JSON 배열에서 첫 번째 이미지 반환', () => {
    const urls = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
    expect(getFirstImage(JSON.stringify(urls))).toBe(urls[0])
  })
})
