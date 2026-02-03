import { redirect } from 'next/navigation'

export const metadata = {
  title: '소개 | 지옹이 미니홈피',
  description: 'IT 인프라 엔지니어 지옹의 상세 소개 페이지입니다.',
}

export default function AboutPage() {
  redirect('/#career')
}
