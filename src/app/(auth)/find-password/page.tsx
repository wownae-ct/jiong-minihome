'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, ResetPasswordInput } from '@/lib/validations/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

export default function FindPasswordPage() {
  const { error: showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        showError(responseData.error || '비밀번호 재설정에 실패했습니다')
        return
      }

      setIsSent(true)
    } catch {
      showError('비밀번호 재설정 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-display font-bold text-primary">
              지옹&apos;s<br />미니홈피
            </h1>
          </Link>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            가입한 이메일로 임시 비밀번호를 발송합니다
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {!isSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="이메일"
                type="email"
                placeholder="가입 시 사용한 이메일을 입력하세요"
                error={errors.email?.message}
                {...register('email')}
              />

              <Button
                type="submit"
                className="w-full justify-center"
                disabled={isLoading}
              >
                {isLoading ? '발송 중...' : '임시 비밀번호 발급'}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">
                  check_circle
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                임시 비밀번호가 이메일로 발송되었습니다
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                로그인 후 반드시 비밀번호를 변경해주세요
              </p>
              <Link href="/login">
                <Button className="w-full justify-center mt-4">
                  로그인하러 가기
                </Button>
              </Link>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
            <span>|</span>
            <Link href="/find-email" className="text-primary hover:underline font-medium">
              아이디 찾기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
