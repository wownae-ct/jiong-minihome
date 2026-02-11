import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteConfirmModal } from './DeleteConfirmModal'

describe('DeleteConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: '삭제 확인',
    message: '정말 삭제하시겠습니까?',
  }

  it('열려있을 때 모달이 렌더링되어야 한다', () => {
    render(<DeleteConfirmModal {...defaultProps} />)
    expect(screen.getByText('삭제 확인')).toBeInTheDocument()
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument()
  })

  it('닫혀있으면 아무것도 렌더링하지 않아야 한다', () => {
    render(<DeleteConfirmModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('삭제 확인')).not.toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 onConfirm을 호출해야 한다', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<DeleteConfirmModal {...defaultProps} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(onConfirm).toHaveBeenCalled()
  })

  it('취소 버튼 클릭 시 onClose를 호출해야 한다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<DeleteConfirmModal {...defaultProps} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('로딩 중이면 버튼이 비활성화되어야 한다', () => {
    render(<DeleteConfirmModal {...defaultProps} isLoading />)

    expect(screen.getByRole('button', { name: '삭제 중...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled()
  })

  it('preview가 제공되면 렌더링해야 한다', () => {
    render(
      <DeleteConfirmModal
        {...defaultProps}
        preview={<div data-testid="preview">미리보기</div>}
      />
    )
    expect(screen.getByTestId('preview')).toBeInTheDocument()
  })
})
