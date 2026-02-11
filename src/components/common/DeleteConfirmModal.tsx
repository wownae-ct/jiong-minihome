'use client'

import { ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  isLoading?: boolean
  preview?: ReactNode
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
  preview,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-400">{message}</p>
        {preview}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? '삭제 중...' : '삭제'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
