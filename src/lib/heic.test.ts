/**
 * @vitest-environment node
 */
import { isHeicFile } from './heic'

describe('isHeicFile', () => {
  it('image/heic MIME 타입을 HEIC로 판별한다', () => {
    expect(isHeicFile('image/heic', 'photo.heic')).toBe(true)
  })

  it('image/heif MIME 타입을 HEIC로 판별한다', () => {
    expect(isHeicFile('image/heif', 'photo.heif')).toBe(true)
  })

  it('대소문자 구분 없이 판별한다', () => {
    expect(isHeicFile('IMAGE/HEIC', 'photo.HEIC')).toBe(true)
  })

  it('type이 비어있어도 .heic 확장자면 HEIC로 판별한다', () => {
    expect(isHeicFile('', 'IMG_1234.heic')).toBe(true)
  })

  it('type이 application/octet-stream이고 .heif 확장자면 HEIC로 판별한다', () => {
    expect(isHeicFile('application/octet-stream', 'IMG_1234.heif')).toBe(true)
  })

  it('일반 jpeg 이미지는 HEIC가 아니다', () => {
    expect(isHeicFile('image/jpeg', 'photo.jpg')).toBe(false)
  })

  it('png 이미지는 HEIC가 아니다', () => {
    expect(isHeicFile('image/png', 'photo.png')).toBe(false)
  })

  it('type이 비어있고 확장자도 HEIC가 아니면 false', () => {
    expect(isHeicFile('', 'photo.jpg')).toBe(false)
  })
})
