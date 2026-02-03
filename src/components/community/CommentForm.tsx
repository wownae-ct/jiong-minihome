'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

interface CommentFormProps {
  postId: number
  parentId?: number
  onSuccess?: () => void
  onCancel?: () => void
  placeholder?: string
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = '댓글을 입력하세요',
}: CommentFormProps) {
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!session) {
    return (
      <div className="text-center py-4 text-slate-500 dark:text-slate-400">
        <Link href="/login" className="text-primary hover:underline">
          로그인
        </Link>
        하고 댓글을 작성하세요.
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      showError('댓글 내용을 입력해주세요')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId }),
      })

      const result = await response.json()

      if (!response.ok) {
        showError(result.error || '댓글 작성에 실패했습니다')
        return
      }

      success('댓글이 등록되었습니다')
      setContent('')
      onSuccess?.()
    } catch {
      showError('댓글 작성 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px]"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '등록 중...' : parentId ? '답글 등록' : '댓글 등록'}
        </Button>
      </div>
    </form>
  )
}
