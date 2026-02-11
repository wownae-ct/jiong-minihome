import { bgmTrackSchema, bgmCreateSchema, bgmUpdateSchema } from './bgm'

describe('bgmTrackSchema', () => {
  it('유효한 BGM 데이터를 통과시킨다', () => {
    const result = bgmTrackSchema.safeParse({
      title: '바람, 어디에서 부는지',
      artist: 'Lucid Fall',
      duration: 222,
    })
    expect(result.success).toBe(true)
  })

  it('제목은 필수이다', () => {
    const result = bgmTrackSchema.safeParse({
      artist: 'Lucid Fall',
    })
    expect(result.success).toBe(false)
  })

  it('빈 제목은 거부한다', () => {
    const result = bgmTrackSchema.safeParse({
      title: '',
    })
    expect(result.success).toBe(false)
  })

  it('제목은 200자 이내여야 한다', () => {
    const result = bgmTrackSchema.safeParse({
      title: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('아티스트는 선택이다', () => {
    const result = bgmTrackSchema.safeParse({
      title: '테스트 곡',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.artist).toBeUndefined()
    }
  })

  it('아티스트는 200자 이내여야 한다', () => {
    const result = bgmTrackSchema.safeParse({
      title: '테스트 곡',
      artist: 'a'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('duration은 선택이다', () => {
    const result = bgmTrackSchema.safeParse({
      title: '테스트 곡',
    })
    expect(result.success).toBe(true)
  })

  it('duration은 0 이상의 정수여야 한다', () => {
    expect(bgmTrackSchema.safeParse({ title: '곡', duration: -1 }).success).toBe(false)
    expect(bgmTrackSchema.safeParse({ title: '곡', duration: 1.5 }).success).toBe(false)
    expect(bgmTrackSchema.safeParse({ title: '곡', duration: 0 }).success).toBe(true)
    expect(bgmTrackSchema.safeParse({ title: '곡', duration: 300 }).success).toBe(true)
  })
})

describe('bgmCreateSchema', () => {
  it('유효한 생성 데이터를 통과시킨다', () => {
    const result = bgmCreateSchema.safeParse({
      title: '테스트 곡',
      artist: '아티스트',
      url: '/uploads/test.mp3',
      originalName: 'test.mp3',
      filename: 'uuid-test.mp3',
    })
    expect(result.success).toBe(true)
  })

  it('url은 필수이다', () => {
    const result = bgmCreateSchema.safeParse({
      title: '테스트 곡',
      originalName: 'test.mp3',
      filename: 'uuid-test.mp3',
    })
    expect(result.success).toBe(false)
  })

  it('originalName은 필수이다', () => {
    const result = bgmCreateSchema.safeParse({
      title: '테스트 곡',
      url: '/uploads/test.mp3',
      filename: 'uuid-test.mp3',
    })
    expect(result.success).toBe(false)
  })

  it('filename은 필수이다', () => {
    const result = bgmCreateSchema.safeParse({
      title: '테스트 곡',
      url: '/uploads/test.mp3',
      originalName: 'test.mp3',
    })
    expect(result.success).toBe(false)
  })

  it('fileSize는 선택이다', () => {
    const result = bgmCreateSchema.safeParse({
      title: '테스트 곡',
      url: '/uploads/test.mp3',
      originalName: 'test.mp3',
      filename: 'uuid-test.mp3',
      fileSize: 1024000,
    })
    expect(result.success).toBe(true)
  })
})

describe('bgmUpdateSchema', () => {
  it('부분 업데이트를 허용한다', () => {
    expect(bgmUpdateSchema.safeParse({ title: '새 제목' }).success).toBe(true)
    expect(bgmUpdateSchema.safeParse({ artist: '새 아티스트' }).success).toBe(true)
    expect(bgmUpdateSchema.safeParse({ isActive: false }).success).toBe(true)
    expect(bgmUpdateSchema.safeParse({ sortOrder: 5 }).success).toBe(true)
  })

  it('빈 객체도 허용한다', () => {
    expect(bgmUpdateSchema.safeParse({}).success).toBe(true)
  })

  it('isActive는 boolean이어야 한다', () => {
    expect(bgmUpdateSchema.safeParse({ isActive: 'yes' }).success).toBe(false)
  })

  it('sortOrder는 0 이상의 정수여야 한다', () => {
    expect(bgmUpdateSchema.safeParse({ sortOrder: -1 }).success).toBe(false)
    expect(bgmUpdateSchema.safeParse({ sortOrder: 0 }).success).toBe(true)
  })
})
