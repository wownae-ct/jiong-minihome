/**
 * Welcome Section / Welcome Detail 공용 상수
 *
 * 환경변수로 오버라이드 가능하도록 설계됨. 기본값은 외부 CDN URL.
 */

const DEFAULT_SERVER_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBpAQmgpKCQq95ZoNIIwzLRA8DRwh6rIOwnXnpucxvakzeSK1UIzGMOOQ898nH52Bf2IPaUDmciWyAitcgaQijeWJLUIZ_YuRAYDpmImEaOrFvyTDMF7mq6j73c-o16cRUbg-406likvCIy2-TYoc0ZW3dPUSd0fuzcD-PkCiu5yzzQ5wlGtJxxGRun8_79iQYulHi69TIGLx6iPxt75avBtRVrvSZot6jHoQYxxQ3DxbpNu7XIhTV48yJqCNtBci9NV4xB-mwTr9E'

const DEFAULT_HEADER_IMAGE_URL =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop'

/** WelcomeSection에 표시되는 서버 인프라 이미지 URL */
export const WELCOME_SERVER_IMAGE_URL =
  process.env.NEXT_PUBLIC_WELCOME_SERVER_IMAGE_URL || DEFAULT_SERVER_IMAGE_URL

/** WelcomeDetail 페이지 헤더 배경 이미지 URL */
export const WELCOME_HEADER_IMAGE_URL =
  process.env.NEXT_PUBLIC_WELCOME_HEADER_IMAGE_URL || DEFAULT_HEADER_IMAGE_URL
