import { redirect } from 'next/navigation'

export const metadata = {
  title: '포트폴리오 | 지옹이 미니홈피',
  description: 'IT 인프라 엔지니어 지옹의 포트폴리오입니다.',
}

export default function PortfolioPage() {
  redirect('/#portfolio')
}
