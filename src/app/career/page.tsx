import { redirect } from 'next/navigation'

export const metadata = {
  title: '경력 | 지옹이 미니홈피',
  description: 'IT 인프라 엔지니어 지옹의 경력 사항입니다.',
}

export default function CareerPage() {
  redirect('/#career')
}
