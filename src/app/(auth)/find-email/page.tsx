'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { findEmailSchema, FindEmailInput } from '@/lib/validations/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'

interface FindEmailResult {
  email: string
  isOAuth: boolean
}

export default function FindEmailPage() {
  const { error: showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<FindEmailResult | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FindEmailInput>({
    resolver: zodResolver(findEmailSchema),
  })

  const onSubmit = async (data: FindEmailInput) => {
    setIsLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/auth/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        showError(responseData.error || '이메일 찾기에 실패했습니다')
        return
      }

      setResult(responseData)
    } catch {
      showError('이메일 찾기 중 오류가 발생했습니다')
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
            닉네임으로 가입된 이메일을 찾을 수 있습니다
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {!result ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="닉네임"
                type="text"
                placeholder="가입 시 사용한 닉네임을 입력하세요"
                error={errors.nickname?.message}
                {...register('nickname')}
              />

              <Button
                type="submit"
                className="w-full justify-center"
                disabled={isLoading}
              >
                {isLoading ? '찾는 중...' : '이메일 찾기'}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-slate-700 dark:text-slate-300">
                가입된 이메일 주소입니다
              </p>
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                {result.email}
              </p>
              {result.isOAuth && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  소셜 로그인으로 가입된 계정입니다
                </p>
              )}
              <Button
                onClick={() => setResult(null)}
                variant="ghost"
                className="w-full justify-center border border-slate-300 dark:border-slate-600"
              >
                다시 찾기
              </Button>
            </div>
          )}

          <div className="mt-6 flex justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/login" className="text-primary hover:underline font-medium">
              로그인
            </Link>
            <span>|</span>
            <Link href="/find-password" className="text-primary hover:underline font-medium">
              비밀번호 찾기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
