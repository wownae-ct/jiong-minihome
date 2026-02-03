import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export const metadata = {
  title: '관리자 | 지옹이 미니홈피',
  description: '관리자 페이지',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin')
  }

  if (session.user.role !== 'admin') {
    redirect('/')
  }

  return <>{children}</>
}
