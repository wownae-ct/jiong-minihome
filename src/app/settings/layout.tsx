import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export const metadata = {
  title: '설정 | 지옹이 미니홈피',
  description: '사용자 설정 페이지',
}

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/settings')
  }

  return <>{children}</>
}
