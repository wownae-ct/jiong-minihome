'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/providers/ToastProvider'

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export function AccountSettings() {
  const { data: session } = useSession()
  const { success, error: showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PasswordForm>()

  const newPassword = watch('newPassword')

  const onSubmit = async (data: PasswordForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        showError(result.error || '비밀번호 변경에 실패했습니다')
        return
      }

      success('비밀번호가 변경되었습니다')
      reset()
    } catch {
      showError('비밀번호 변경 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 계정 정보 */}
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon name="email" size="sm" />
          계정 정보
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">이메일</span>
            <span className="text-sm text-slate-900 dark:text-slate-100">
              {session?.user?.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">가입 방식</span>
            <span className="text-sm text-slate-900 dark:text-slate-100">
              이메일
            </span>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 */}
      <div>
        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon name="lock" size="sm" />
          비밀번호 변경
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            type="password"
            label="현재 비밀번호"
            placeholder="현재 비밀번호를 입력하세요"
            error={errors.currentPassword?.message}
            {...register('currentPassword', { required: '현재 비밀번호를 입력해주세요' })}
          />

          <Input
            type="password"
            label="새 비밀번호"
            placeholder="새 비밀번호를 입력하세요"
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: '새 비밀번호를 입력해주세요',
              minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다' },
            })}
          />

          <Input
            type="password"
            label="새 비밀번호 확인"
            placeholder="새 비밀번호를 다시 입력하세요"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: '비밀번호 확인을 입력해주세요',
              validate: (value) => value === newPassword || '비밀번호가 일치하지 않습니다',
            })}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </div>
        </form>
      </div>

      {/* 소셜 계정 연동 */}
      <div>
        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Icon name="link" size="sm" />
          소셜 계정 연동
        </h3>
        <div className="space-y-3">
          <SocialAccount provider="kakao" name="카카오" connected={false} />
          <SocialAccount provider="naver" name="네이버" connected={false} />
          <SocialAccount provider="google" name="Google" connected={false} />
        </div>
      </div>
    </div>
  )
}

function SocialAccount({
  provider,
  name,
  connected,
}: {
  provider: string
  name: string
  connected: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
          <Icon name="account_circle" />
        </div>
        <span className="font-medium text-slate-900 dark:text-slate-100">{name}</span>
      </div>
      {connected ? (
        <Button variant="ghost" size="sm">
          연결 해제
        </Button>
      ) : (
        <Button variant="primary" size="sm">
          연결
        </Button>
      )}
    </div>
  )
}
