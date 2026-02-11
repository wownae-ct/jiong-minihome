'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { postSchema, guestPostSchema, type PostInput, type GuestPostInput } from '@/lib/validations/post'

type PostFormData = PostInput & Partial<Pick<GuestPostInput, 'guestName' | 'guestPassword'>>
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

interface Category {
  id: number
  name: string
  slug: string
}

interface PostFormProps {
  initialData?: {
    id: number
    title: string
    content: string
    categoryId: number
    isPrivate: boolean
    isGuestPost?: boolean
  }
  guestPassword?: string
  onCancel?: () => void
  onSuccess?: () => void
}

export function PostForm({ initialData, guestPassword, onCancel, onSuccess }: PostFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const isGuest = !session
  const isGuestEdit = initialData?.isGuestPost && isGuest

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(isGuest && !initialData ? guestPostSchema : postSchema),
    defaultValues: initialData || {
      isPrivate: false,
    },
  })

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then(setCategories)
      .catch(console.error)
  }, [])

  const onSubmit = async (data: PostFormData) => {
    setIsLoading(true)
    try {
      const url = initialData
        ? `/api/posts/${initialData.id}`
        : '/api/posts'
      const method = initialData ? 'PUT' : 'POST'

      // 비회원 글 수정 시 비밀번호 포함
      const bodyData = initialData && (isGuestEdit || initialData.isGuestPost)
        ? { ...data, password: guestPassword }
        : data

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      })

      const result = await response.json()

      if (!response.ok) {
        showError(result.error || '게시글 저장에 실패했습니다')
        return
      }

      success(initialData ? '게시글이 수정되었습니다' : '게시글이 등록되었습니다')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/community/${result.category.slug}/${result.id}`)
        router.refresh()
      }
    } catch {
      showError('게시글 저장 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* 비로그인 시 닉네임/비밀번호 입력 */}
      {isGuest && !initialData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
          <Input
            label="닉네임"
            placeholder="닉네임을 입력하세요"
            error={errors.guestName?.message}
            {...register('guestName')}
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="수정/삭제용 비밀번호"
            error={errors.guestPassword?.message}
            {...register('guestPassword')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            카테고리
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            {...register('categoryId', { valueAsNumber: true })}
          >
            <option value="">카테고리 선택</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="mt-1 text-sm text-red-500">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              {...register('isPrivate')}
            />
            비밀글
          </label>
        </div>
      </div>

      <Input
        label="제목"
        placeholder="제목을 입력하세요"
        error={errors.title?.message}
        {...register('title')}
      />

      <Textarea
        label="내용"
        placeholder="내용을 입력하세요"
        error={errors.content?.message}
        className="min-h-[300px]"
        {...register('content')}
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel || (() => router.back())}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '저장 중...' : initialData ? '수정하기' : '등록하기'}
        </Button>
      </div>
    </form>
  )
}
