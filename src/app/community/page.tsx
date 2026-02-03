import { redirect } from 'next/navigation'

export const metadata = {
  title: '커뮤니티 | 지옹이 미니홈피',
  description: '지옹이 미니홈피 커뮤니티입니다.',
}

export default function CommunityPage() {
  redirect('/#community')
}
