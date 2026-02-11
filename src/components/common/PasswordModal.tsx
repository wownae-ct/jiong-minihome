'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (password: string) => void
  title: string
  isLoading?: boolean
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
}

export function PasswordModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  isLoading = false,
  confirmLabel = '확인',
  confirmVariant = 'primary',
}: PasswordModalProps) {
  const [password, setPassword] = useState('')

  const handleConfirm = () => {
    onConfirm(password)
  }

  const handleClose = () => {
    setPassword('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-400">
          작성 시 입력한 비밀번호를 입력해주세요.
        </p>
        <Input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={confirmVariant === 'danger' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            {isLoading ? '처리 중...' : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
