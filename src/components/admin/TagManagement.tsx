'use client'

import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, Tag } from '@/hooks/usePortfolios'
import { useToast } from '@/components/providers/ToastProvider'

interface TagManagementProps {
  isOpen: boolean
  onClose: () => void
}

export function TagManagement({ isOpen, onClose }: TagManagementProps) {
  const toast = useToast()
  const { data: tags = [], isLoading, refetch } = useTags()
  const createMutation = useCreateTag()
  const updateMutation = useUpdateTag()
  const deleteMutation = useDeleteTag()

  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState('#3b82f6')
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.toast('태그 이름을 입력해주세요.', 'error')
      return
    }

    try {
      await createMutation.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
      })
      toast.toast('태그가 생성되었습니다.', 'success')
      setNewTagName('')
      setNewTagColor('#3b82f6')
      refetch()
    } catch (error) {
      toast.toast(
        error instanceof Error ? error.message : '태그 생성에 실패했습니다.',
        'error'
      )
    }
  }

  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag)
    setEditName(tag.name)
    setEditColor(tag.color || '#3b82f6')
  }

  const handleUpdateTag = async () => {
    if (!editingTag || !editName.trim()) {
      toast.toast('태그 이름을 입력해주세요.', 'error')
      return
    }

    try {
      await updateMutation.mutateAsync({
        id: editingTag.id,
        name: editName.trim(),
        color: editColor,
      })
      toast.toast('태그가 수정되었습니다.', 'success')
      setEditingTag(null)
      refetch()
    } catch (error) {
      toast.toast(
        error instanceof Error ? error.message : '태그 수정에 실패했습니다.',
        'error'
      )
    }
  }

  const handleDeleteTag = async (tag: Tag) => {
    if (
      !confirm(
        `"${tag.name}" 태그를 삭제하시겠습니까?\n이 태그가 연결된 ${tag.count}개의 포트폴리오에서 제거됩니다.`
      )
    ) {
      return
    }

    try {
      await deleteMutation.mutateAsync(tag.id)
      toast.toast('태그가 삭제되었습니다.', 'success')
      refetch()
    } catch (error) {
      toast.toast(
        error instanceof Error ? error.message : '태그 삭제에 실패했습니다.',
        'error'
      )
    }
  }

  const handleCancelEdit = () => {
    setEditingTag(null)
    setEditName('')
    setEditColor('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="기술 태그 관리" size="lg">
      <div className="space-y-6">
        {/* 새 태그 추가 */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            새 태그 추가
          </h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="태그 이름"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="태그 이름 입력"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                색상
              </label>
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-10 h-10 rounded border border-slate-300 dark:border-slate-600 cursor-pointer"
              />
            </div>
            <Button
              onClick={handleCreateTag}
              disabled={createMutation.isPending}
            >
              <Icon name="add" size="sm" />
              추가
            </Button>
          </div>
        </div>

        {/* 태그 목록 */}
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            등록된 태그 ({tags.length}개)
          </h3>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"
                />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <p className="text-center py-8 text-slate-500">
              등록된 태그가 없습니다.
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {editingTag?.id === tag.id ? (
                    <>
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 cursor-pointer flex-shrink-0"
                      />
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateTag()
                          if (e.key === 'Escape') handleCancelEdit()
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={handleUpdateTag}
                        disabled={updateMutation.isPending}
                      >
                        <Icon name="check" size="sm" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                      >
                        <Icon name="close" size="sm" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color || '#3b82f6' }}
                      />
                      <span className="flex-1 font-medium text-slate-900 dark:text-slate-100">
                        {tag.name}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {tag.count}개 사용
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(tag)}
                      >
                        <Icon name="edit" size="sm" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTag(tag)}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Icon name="delete" size="sm" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
