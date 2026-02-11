import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordModal } from './PasswordModal'

describe('PasswordModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: '비밀번호 확인',
  }

  it('열려있을 때 모달이 렌더링되어야 한다', () => {
    render(<PasswordModal {...defaultProps} />)
    expect(screen.getByText('비밀번호 확인')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('비밀번호')).toBeInTheDocument()
  })

  it('닫혀있으면 아무것도 렌더링하지 않아야 한다', () => {
    render(<PasswordModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('비밀번호 확인')).not.toBeInTheDocument()
  })

  it('확인 버튼 클릭 시 비밀번호를 전달해야 한다', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<PasswordModal {...defaultProps} onConfirm={onConfirm} />)

    await user.type(screen.getByPlaceholderText('비밀번호'), 'test1234')
    await user.click(screen.getByRole('button', { name: '확인' }))

    expect(onConfirm).toHaveBeenCalledWith('test1234')
  })

  it('Enter 키 입력 시 비밀번호를 전달해야 한다', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<PasswordModal {...defaultProps} onConfirm={onConfirm} />)

    await user.type(screen.getByPlaceholderText('비밀번호'), 'test1234{Enter}')

    expect(onConfirm).toHaveBeenCalledWith('test1234')
  })

  it('취소 버튼 클릭 시 onClose를 호출해야 한다', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<PasswordModal {...defaultProps} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: '취소' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('로딩 중이면 버튼이 비활성화되어야 한다', () => {
    render(<PasswordModal {...defaultProps} isLoading />)

    expect(screen.getByRole('button', { name: '처리 중...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled()
  })

  it('커스텀 confirmLabel이 표시되어야 한다', () => {
    render(<PasswordModal {...defaultProps} confirmLabel="삭제" />)
    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('danger variant일 때 빨간색 스타일이 적용되어야 한다', () => {
    render(<PasswordModal {...defaultProps} confirmVariant="danger" />)
    const confirmBtn = screen.getByRole('button', { name: '확인' })
    expect(confirmBtn.className).toContain('bg-red-500')
  })
})
