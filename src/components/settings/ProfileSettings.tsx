'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/providers/ToastProvider'

interface ProfileForm {
  nickname: string
  bio: string
}

export function ProfileSettings() {
  const { data: session, update } = useSession()
  const { success, error: showError } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [imageError, setImageError] = useState(false)
  const previewUrlRef = useRef<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>()

  // blob URL 정리
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // 마운트 시 서버에서 프로필 데이터 로드 (session 변경에 의존하지 않음)
    fetch('/api/users/me')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          reset({
            nickname: data.nickname || '',
            bio: data.bio || '',
          })
          setProfileImage(data.profileImage || null)
        }
      })
      .catch(() => {
        // 폴백: 빈 상태 유지
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이전 blob URL 정리
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    // 브라우저 메모리에서 미리보기 생성 (서버 호출 없음)
    const blobUrl = URL.createObjectURL(file)
    previewUrlRef.current = blobUrl
    setProfileImage(blobUrl)
    setImageError(false)
    setPendingFile(file)
  }

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    try {
      let imageUrl = profileImage

      // 대기 중인 파일이 있으면 S3에 업로드
      if (pendingFile) {
        const formData = new FormData()
        formData.append('file', pendingFile)
        formData.append('type', 'profile')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          showError('이미지 업로드에 실패했습니다')
          return
        }

        const { url } = await uploadResponse.json()
        imageUrl = url
      }

      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ...(imageUrl ? { profileImage: imageUrl } : {}),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        showError(result.error || '프로필 수정에 실패했습니다')
        return
      }

      // 저장 완료: blob URL 정리 및 S3 URL로 교체
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setPendingFile(null)
      setProfileImage(result.profileImage ?? imageUrl)
      setImageError(false)

      reset({
        nickname: result.nickname || data.nickname,
        bio: result.bio ?? data.bio,
      })

      success('프로필이 수정되었습니다')
      await update({})
    } catch {
      showError('프로필 수정 중 오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 프로필 이미지 */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {profileImage && !imageError ? (
            <img
              src={profileImage}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
          <label className="absolute bottom-0 right-0 p-2 flex items-center justify-center bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
            <Icon name="photo_camera" size="sm" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
        <div>
          <h3 className="font-medium text-slate-900 dark:text-slate-100">
            프로필 사진
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            JPG, PNG 형식, 최대 5MB
          </p>
        </div>
      </div>

      {/* 프로필 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="닉네임"
          placeholder="닉네임을 입력하세요"
          error={errors.nickname?.message}
          {...register('nickname', { required: '닉네임을 입력해주세요' })}
        />

        <Textarea
          label="자기소개"
          placeholder="자기소개를 입력하세요"
          error={errors.bio?.message}
          {...register('bio')}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  )
}
