import { redirect } from 'next/navigation'

export const metadata = {
  title: '다이어리 | 지옹이 미니홈피',
  description: 'IT 인프라 엔지니어 지옹의 다이어리입니다.',
}

export default function DiaryPage() {
  redirect('/#diary')
}
