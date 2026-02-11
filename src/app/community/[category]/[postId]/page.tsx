import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { MainLayout } from '@/components/layout/MainLayout'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { PostPageClient } from '@/components/community/PostPageClient'

interface PageProps {
  params: Promise<{
    category: string
    postId: string
  }>
}

export async function generateMetadata({ params }: PageProps) {
  const { postId } = await params
  const post = await prisma.post.findUnique({
    where: { id: parseInt(postId), isDeleted: false },
    select: { title: true },
  })

  return {
    title: post ? `${post.title} | 커뮤니티` : '게시글',
  }
}

export default async function PostPage({ params }: PageProps) {
  const { postId } = await params
  const id = parseInt(postId)

  if (isNaN(id)) {
    notFound()
  }

  const post = await prisma.post.findUnique({
    where: { id, isDeleted: false },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          profileImage: true,
        },
      },
      category: true,
    },
  })

  if (!post) {
    notFound()
  }

  // 조회수 증가
  await prisma.post.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  })

  return (
    <MainLayout sidebar={<Sidebar />}>
      <PostPageClient
        post={{
          ...post,
          viewCount: (post.viewCount ?? 0) + 1,
          likeCount: post.likeCount ?? 0,
          commentCount: post.commentCount ?? 0,
          isPinned: post.isPinned ?? false,
          isPrivate: post.isPrivate ?? false,
          createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: post.updatedAt?.toISOString() ?? new Date().toISOString(),
        }}
      />
    </MainLayout>
  )
}
