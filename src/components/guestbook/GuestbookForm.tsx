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
      className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-3 sm:p-5 border border-slate-100 dark:border-slate-700"
    >
      <div className="space-y-3">
        {/* 비회원인 경우 이름, 비밀번호 입력 */}
        {!session && (
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <Input
              label="이름"
              placeholder="이름"
              error={errors.guestName?.message}
              {...register('guestName')}
            />
            <Input
              label="비밀번호"
              type="password"
              placeholder="삭제 시 필요"
              error={errors.guestPassword?.message}
              {...register('guestPassword')}
            />
          </div>
        )}

        <Textarea
          placeholder="방명록을 남겨주세요 (500자 이내)"
          error={errors.content?.message}
          rows={2}
          {...register('content')}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-slate-300 text-primary focus:ring-primary"
              {...register('isPrivate')}
            />
            비밀글
          </label>

          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? '작성 중...' : '작성'}
          </Button>
        </div>
      </div>
    </form>
  )
}
