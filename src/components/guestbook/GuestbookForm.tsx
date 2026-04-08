'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { guestbookSchema, GuestbookInput } from '@/lib/validations/guestbook'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

interface GuestbookFormProps {
  onSuccess?: () => void
}

export function GuestbookForm({ onSuccess }: GuestbookFormProps) {
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestbookInput>({
    resolver: zodResolver(guestbookSchema),
    defaultValues: {
      isPrivate: false,
    },
  })

  const onSubmit = async (data: GuestbookInput) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        showError(result.error || '방명록 작성에 실패했습니다')
        return
      }

      success('방명록이 등록되었습니다')
      reset()
      onSuccess?.()
    } catch {
      showError('방명록 작성 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700"
    >
      <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
        방명록 작성
      </h3>

      <div className="space-y-4">
        {/* 비회원인 경우 이름, 비밀번호 입력 */}
        {!session && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="이름"
              placeholder="이름을 입력하세요"
              error={errors.guestName?.message}
              {...register('guestName')}
            />
            <Input
              label="비밀번호"
              type="password"
              placeholder="삭제 시 필요합니다"
              error={errors.guestPassword?.message}
              {...register('guestPassword')}
            />
          </div>
        )}

        <Textarea
          label="내용"
          placeholder="방명록을 남겨주세요 (500자 이내)"
          error={errors.content?.message}
          {...register('content')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              {...register('isPrivate')}
            />
            비밀글
          </label>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? '작성 중...' : '작성하기'}
          </Button>
        </div>
      </div>
    </form>
  )
}
