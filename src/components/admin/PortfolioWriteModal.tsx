'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { TagInput } from '@/components/ui/TagInput'
import { ImageDropZone } from '@/components/ui/ImageDropZone'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { DraftSlotPicker } from './DraftSlotPicker'
import { SaveIndicator, SaveIndicatorChip, type SaveStatus } from './SaveIndicator'
import {
  useCreatePortfolio,
  useUpdatePortfolio,
  useTags,
  usePortfolioDetail,
  Portfolio,
} from '@/hooks/usePortfolios'
import { useDraftSlots, useEditDraft, DraftData } from '@/hooks/useLocalDraft'
import { portfolioCreateSchema, PortfolioCreateInput } from '@/lib/validations/portfolio'
import { useToast } from '@/components/providers/ToastProvider'
import { parsePortfolioImages } from '@/lib/portfolio-images'

interface PortfolioWriteModalProps {
  isOpen: boolean
  onClose: () => void
  portfolio?: Portfolio | null
  onSuccess?: () => void
}

export function PortfolioWriteModal({
  isOpen,
  onClose,
  portfolio,
  onSuccess,
}: PortfolioWriteModalProps) {
  const toast = useToast()
  const { data: allTags } = useTags()
  const createMutation = useCreatePortfolio()
  const updateMutation = useUpdatePortfolio()
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showDraftPicker, setShowDraftPicker] = useState(false)
  const [draftChecked, setDraftChecked] = useState(false)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null)

  // 저장 상태 인디케이터
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const isEditMode = !!portfolio

  // 수정 모드: DB 데이터 fetch
  const { data: fetchedPortfolio, isLoading: isLoadingPortfolio } = usePortfolioDetail(
    isEditMode && isOpen ? portfolio.id : null
  )

  // 수정 모드 드래프트 (portfolioId별 단일)
  const editDraft = useEditDraft(isEditMode ? portfolio?.id : undefined)

  // 새 글 모드 슬롯 (최대 3개)
  const { slots, saveToSlot, deleteSlot, findEmptySlotIndex } = useDraftSlots()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PortfolioCreateInput>({
    resolver: zodResolver(portfolioCreateSchema),
    defaultValues: {
      title: '',
      content: '',
      description: '',
      image: [],
      githubUrl: '',
      notionUrl: '',
      featured: false,
      tags: [],
    },
  })

  // form 변경 감지 → isDirty true (saved 상태도 변경되면 dirty로 전환)
  useEffect(() => {
    if (!isOpen) return
    const subscription = watch(() => {
      if (saveStatus === 'saved') setSaveStatus('idle')
      setIsDirty(true)
    })
    return () => subscription.unsubscribe()
  }, [watch, isOpen, saveStatus])

  const resetToOriginal = useCallback(
    (data: Portfolio) => {
      const images = parsePortfolioImages(data.image)
      reset({
        title: data.title || '',
        content: data.content || '',
        description: data.description || '',
        image: images,
        githubUrl: data.githubUrl || '',
        notionUrl: data.notionUrl || '',
        featured: data.featured || false,
        tags: data.tags || [],
      })
      setPreviewUrls(images)
      setIsDirty(false)
    },
    [reset]
  )

  const resetToEmpty = useCallback(() => {
    reset({
      title: '',
      content: '',
      description: '',
      image: [],
      githubUrl: '',
      notionUrl: '',
      featured: false,
      tags: [],
    })
    setPreviewUrls([])
    setIsDirty(false)
  }, [reset])

  // 모달 열릴 때 드래프트 진입 플로우 결정
  useEffect(() => {
    if (!isOpen) {
      setDraftChecked(false)
      setShowDraftPicker(false)
      setActiveSlotIndex(null)
      setSaveStatus('idle')
      setLastSavedAt(null)
      setIsDirty(false)
      return
    }

    // 수정 모드: DB 데이터 로드 완료 후 단일 드래프트 확인
    if (isEditMode && fetchedPortfolio && !draftChecked) {
      if (editDraft.hasDraft && editDraft.draft) {
        const draftData = editDraft.draft.data
        const images = Array.isArray(draftData.image)
          ? draftData.image
          : parsePortfolioImages(draftData.image)
        reset({
          title: draftData.title || '',
          content: draftData.content || '',
          description: draftData.description || '',
          image: images,
          githubUrl: draftData.githubUrl || '',
          notionUrl: draftData.notionUrl || '',
          featured: draftData.featured || false,
          tags: draftData.tags || [],
        })
        setPreviewUrls(images)
        setLastSavedAt(editDraft.draft.savedAt)
        setIsDirty(false)
      } else {
        resetToOriginal(fetchedPortfolio)
      }
      setDraftChecked(true)
    }

    // 새 글 모드: 슬롯 상태 확인
    if (!isEditMode && !draftChecked) {
      const hasAny = slots.some((s) => s.data !== null)
      if (hasAny) {
        setShowDraftPicker(true)
      } else {
        resetToEmpty()
      }
      setDraftChecked(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isEditMode, fetchedPortfolio, draftChecked])

  // 새 글 모드 슬롯 선택
  const handleSelectSlot = (index: number) => {
    const slot = slots[index]
    if (!slot.data) return
    const data = slot.data
    const images = Array.isArray(data.image) ? data.image : parsePortfolioImages(data.image)
    reset({
      title: data.title || '',
      content: data.content || '',
      description: data.description || '',
      image: images,
      githubUrl: data.githubUrl || '',
      notionUrl: data.notionUrl || '',
      featured: data.featured || false,
      tags: data.tags || [],
    })
    setPreviewUrls(images)
    setActiveSlotIndex(index)
    setLastSavedAt(slot.savedAt)
    setIsDirty(false)
    setSaveStatus('idle')
    setShowDraftPicker(false)
  }

  const handleNewDraft = () => {
    const emptyIndex = findEmptySlotIndex()
    if (emptyIndex === -1) return
    resetToEmpty()
    setActiveSlotIndex(emptyIndex)
    setLastSavedAt(null)
    setSaveStatus('idle')
    setShowDraftPicker(false)
  }

  const handleDeleteSlot = (index: number) => {
    deleteSlot(index)
  }

  const handleCancelPicker = () => {
    setShowDraftPicker(false)
    onClose()
  }

  // 임시 저장 핸들러
  const handleSaveDraft = () => {
    const formData = watch()
    setSaveStatus('saving')

    if (isEditMode && portfolio) {
      editDraft.save(formData as DraftData)
      const now = new Date().toISOString()
      setLastSavedAt(now)
      setIsDirty(false)
      setSaveStatus('saved')
      // 1.5초 후 idle로 복귀
      setTimeout(() => setSaveStatus('idle'), 1500)
      return
    }

    // 새 글 모드: activeSlotIndex가 없으면 첫 빈 슬롯에 저장
    let targetIndex = activeSlotIndex
    if (targetIndex === null) {
      targetIndex = findEmptySlotIndex()
      if (targetIndex === -1) {
        toast.toast(
          '모든 슬롯이 차있습니다. 기존 슬롯에 덮어쓰거나 삭제해주세요.',
          'error'
        )
        setSaveStatus('idle')
        return
      }
      setActiveSlotIndex(targetIndex)
    }

    saveToSlot(targetIndex, formData as DraftData)
    const now = new Date().toISOString()
    setLastSavedAt(now)
    setIsDirty(false)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 1500)
  }

  const tagSuggestions = allTags?.map((t) => t.name) || []

  const handleClose = () => {
    reset()
    setPreviewUrls([])
    setDraftChecked(false)
    setShowDraftPicker(false)
    setActiveSlotIndex(null)
    setSaveStatus('idle')
    setLastSavedAt(null)
    setIsDirty(false)
    onClose()
  }

  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error('이미지 업로드 실패')
        }

        const { url } = await response.json()
        return url
      } finally {
        setIsUploading(false)
      }
    },
    []
  )

  const handleVideoUpload = useCallback(
    async (file: File): Promise<string> => {
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
          fileSize: file.size,
        }),
      })

      if (!presignRes.ok) {
        const data = await presignRes.json()
        throw new Error(data.error || '동영상 업로드 준비에 실패했습니다')
      }

      const { presignedUrl, publicUrl } = await presignRes.json()

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })

      if (!uploadRes.ok) {
        throw new Error('동영상 업로드에 실패했습니다')
      }

      return publicUrl
    },
    []
  )

  const handleUploadError = useCallback(
    (error: Error) => {
      toast.toast(error.message || '파일 업로드에 실패했습니다.', 'error')
    },
    [toast]
  )

  const handleRemoveImage = (index: number) => {
    const current = watch('image')
    const images = Array.isArray(current) ? [...current] : []
    images.splice(index, 1)
    setValue('image', images)
    setPreviewUrls(images)
  }

  const onSubmit = async (data: PortfolioCreateInput) => {
    try {
      if (isEditMode && portfolio) {
        await updateMutation.mutateAsync({ id: portfolio.id, ...data })
        toast.toast('포트폴리오가 수정되었습니다.', 'success')
        editDraft.clear()
      } else {
        await createMutation.mutateAsync(data)
        toast.toast('포트폴리오가 등록되었습니다.', 'success')
        // 등록 성공 시 사용한 슬롯 삭제
        if (activeSlotIndex !== null) {
          deleteSlot(activeSlotIndex)
        }
      }
      handleClose()
      onSuccess?.()
    } catch (error) {
      toast.toast(
        error instanceof Error ? error.message : '저장에 실패했습니다.',
        'error'
      )
    }
  }

  const titleNode = (
    <>
      <span className="truncate">{isEditMode ? '포트폴리오 수정' : '포트폴리오 작성'}</span>
      <SaveIndicatorChip
        status={saveStatus}
        savedAt={lastSavedAt}
        isDirty={isDirty}
      />
    </>
  )

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={titleNode} size="70vw">
        {isEditMode && isLoadingPortfolio ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">
              데이터를 불러오는 중...
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 제목 */}
            <Input
              label="제목"
              placeholder="프로젝트 제목을 입력하세요"
              error={errors.title?.message}
              {...register('title')}
            />

            {/* 간단 설명 */}
            <Textarea
              label="간단 설명"
              placeholder="프로젝트를 간단히 설명해주세요 (목록에 표시됩니다)"
              rows={2}
              error={errors.description?.message}
              {...register('description')}
            />

            {/* 대표 이미지 (최대 2개) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                대표 이미지 <span className="text-slate-400 font-normal">(최대 2개)</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1].map((index) => (
                  <ImageDropZone
                    key={index}
                    previewUrl={previewUrls[index] || null}
                    onImageSelect={async (file) => {
                      try {
                        const url = await handleImageUpload(file)
                        const current = watch('image')
                        const images = Array.isArray(current) ? [...current] : []
                        images[index] = url
                        setValue('image', images.filter(Boolean))
                        setPreviewUrls(images.filter(Boolean))
                        toast.toast('이미지가 업로드되었습니다.', 'success')
                      } catch {
                        toast.toast('이미지 업로드에 실패했습니다.', 'error')
                      }
                    }}
                    onRemove={() => handleRemoveImage(index)}
                    isUploading={isUploading}
                  />
                ))}
              </div>
            </div>

            {/* 본문 (리치 텍스트 에디터) */}
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  label="내용"
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="프로젝트 상세 내용을 작성하세요."
                  error={errors.content?.message}
                  onImageUpload={handleImageUpload}
                  onVideoUpload={handleVideoUpload}
                  onUploadError={handleUploadError}
                />
              )}
            />

            {/* 태그 */}
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagInput
                  label="기술 스택"
                  value={field.value}
                  onChange={field.onChange}
                  suggestions={tagSuggestions}
                  placeholder="태그를 입력하고 Enter를 누르세요"
                  maxTags={10}
                />
              )}
            />

            {/* 링크 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="GitHub URL"
                placeholder="https://github.com/..."
                error={errors.githubUrl?.message}
                {...register('githubUrl')}
              />
              <Input
                label="Notion URL"
                placeholder="https://notion.so/..."
                error={errors.notionUrl?.message}
                {...register('notionUrl')}
              />
            </div>

            {/* Featured 체크박스 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                {...register('featured')}
              />
              <label
                htmlFor="featured"
                className="text-sm text-slate-700 dark:text-slate-300"
              >
                주요 프로젝트로 표시
              </label>
            </div>

            {/* 버튼 */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={handleSaveDraft}>
                  <Icon name="drafts" size="sm" />
                  임시 저장
                </Button>
                <SaveIndicator status={saveStatus} savedAt={lastSavedAt} />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                >
                  <Icon name={isEditMode ? 'save' : 'add'} size="sm" />
                  {isEditMode ? '수정하기' : '등록하기'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      {/* 드래프트 슬롯 선택 다이얼로그 (새 글 모드) */}
      {showDraftPicker && !isEditMode && (
        <DraftSlotPicker
          slots={slots}
          onSelectSlot={handleSelectSlot}
          onNewDraft={handleNewDraft}
          onDeleteSlot={handleDeleteSlot}
          onCancel={handleCancelPicker}
        />
      )}
    </>
  )
}
