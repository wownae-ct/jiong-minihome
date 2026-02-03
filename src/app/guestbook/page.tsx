import { redirect } from 'next/navigation'

export const metadata = {
  title: '방명록 | 지옹이 미니홈피',
  description: '지옹이 미니홈피 방명록입니다.',
}

export default function GuestbookPage() {
  redirect('/#guestbook')
}
