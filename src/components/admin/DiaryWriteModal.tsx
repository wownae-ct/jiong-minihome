'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'

const diarySchema = z.object({
  title: z.string().max(200, '제목은 200자 이하여야 합니다').optional(),
  content: z.string().min(1, '내용을 입력해주세요'),
  mood: z.enum(['happy', 'sad', 'neutral', 'angry', 'excited']).optional(),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'snowy']).optional(),
  isPublic: z.boolean(),
})

type DiaryFormData = z.infer<typeof diarySchema>

interface DiaryWriteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editEntry?: {
    id: number
    title: string | null
    content: string
    mood: string | null
    weather: string | null
    isPublic: boolean
  }
}

const moodOptions = [
  { value: 'happy', label: '행복', icon: 'sentiment_satisfied' },
  { value: 'sad', label: '슬픔', icon: 'sentiment_dissatisfied' },
  { value: 'neutral', label: '평범', icon: 'sentiment_neutral' },
  { value: 'angry', label: '화남', icon: 'mood_bad' },
  { value: 'excited', label: '신남', icon: 'celebration' },
]

const weatherOptions = [
  { value: 'sunny', label: '맑음', icon: 'wb_sunny' },
  { value: 'cloudy', label: '흐림', icon: 'cloud' },
  { value: 'rainy', label: '비', icon: 'water_drop' },
  { value: 'snowy', label: '눈', icon: 'ac_unit' },
]

export function DiaryWriteModal({ isOpen, onClose, onSuccess, editEntry }: DiaryWriteModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditMode = !!editEntry

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DiaryFormData>({
    resolver: zodResolver(diarySchema),
    defaultValues: {
      title: '',
      content: '',
      mood: undefined,
      weather: undefined,
      isPublic: true,
    },
  })

  // 편집 모드: editEntry가 변경되면 폼 값을 채움
  useEffect(() => {
    if (editEntry && isOpen) {
      reset({
        title: editEntry.title || '',
        content: editEntry.content,
        mood: (editEntry.mood as DiaryFormData['mood']) || undefined,
        weather: (editEntry.weather as DiaryFormData['weather']) || undefined,
        isPublic: editEntry.isPublic,
      })
    } else if (!editEntry && isOpen) {
      reset({
        title: '',
        content: '',
        mood: undefined,
        weather: undefined,
        isPublic: true,
      })
    }
  }, [editEntry, isOpen, reset])

  const selectedMood = watch('mood')
  const selectedWeather = watch('weather')

  const onSubmit = async (data: DiaryFormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const url = isEditMode ? `/api/diary/${editEntry.id}` : '/api/diary'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || (isEditMode ? '다이어리 수정에 실패했습니다.' : '다이어리 작성에 실패했습니다.'))
        return
      }

      if (!isEditMode) {
        reset()
      }
      onSuccess?.()
      onClose()
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClasses =
    'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
  const labelClasses = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? '다이어리 수정' : '다이어리 쓰기'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className={labelClasses}>
            제목 (선택)
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className={inputClasses}
            placeholder="오늘의 제목을 입력하세요"
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="content" className={labelClasses}>
            내용
          </label>
          <textarea
            id="content"
            {...register('content')}
            className={`${inputClasses} resize-none`}
            rows={6}
            placeholder="오늘 하루를 기록해보세요..."
          />
          {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>오늘의 기분</label>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setValue('mood', selectedMood === option.value ? undefined : (option.value as DiaryFormData['mood']))
                  }
                  className={`p-2 rounded-lg border transition-colors ${
                    selectedMood === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 dark:border-slate-600 hover:border-primary'
                  }`}
                  title={option.label}
                >
                  <Icon name={option.icon} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClasses}>오늘의 날씨</label>
            <div className="flex flex-wrap gap-2">
              {weatherOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setValue('weather', selectedWeather === option.value ? undefined : (option.value as DiaryFormData['weather']))
                  }
                  className={`p-2 rounded-lg border transition-colors ${
                    selectedWeather === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 dark:border-slate-600 hover:border-primary'
                  }`}
                  title={option.label}
                >
                  <Icon name={option.icon} size="sm" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            {...register('isPublic')}
            className="w-4 h-4 text-primary rounded"
          />
          <label htmlFor="isPublic" className="text-sm text-slate-700 dark:text-slate-300">
            공개 (다른 방문자들도 볼 수 있음)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
