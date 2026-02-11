import { MainLayout } from '@/components/layout/MainLayout'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { PostForm } from '@/components/community/PostForm'

export const metadata = {
  title: '글쓰기 | 커뮤니티',
  description: '새 게시글을 작성합니다',
}

export default async function WritePage() {
  return (
    <MainLayout sidebar={<Sidebar />}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
          글쓰기
        </h2>
        <PostForm />
      </div>
    </MainLayout>
  )
}
