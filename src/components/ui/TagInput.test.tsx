import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TagInput } from './TagInput'

describe('TagInput', () => {
  const defaultProps = {
    value: [] as string[],
    onChange: vi.fn(),
  }

  it('태그 목록을 렌더링해야 함', () => {
    render(<TagInput {...defaultProps} value={['React', 'TypeScript']} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('입력 필드를 렌더링해야 함', () => {
    render(<TagInput {...defaultProps} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('placeholder를 표시해야 함', () => {
    render(<TagInput {...defaultProps} placeholder="태그를 입력하세요" />)

    expect(screen.getByPlaceholderText('태그를 입력하세요')).toBeInTheDocument()
  })

  describe('태그 추가', () => {
    it('Enter 키로 태그를 추가해야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<TagInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'React{enter}')

      expect(onChange).toHaveBeenCalledWith(['React'])
    })

    it('쉼표로 태그를 추가해야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<TagInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'React,')

      expect(onChange).toHaveBeenCalledWith(['React'])
    })

    it('빈 문자열은 추가하지 않아야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<TagInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '   {enter}')

      expect(onChange).not.toHaveBeenCalled()
    })

    it('중복 태그는 추가하지 않아야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<TagInput value={['React']} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'React{enter}')

      expect(onChange).not.toHaveBeenCalled()
    })

    it('태그 추가 후 입력 필드를 비워야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<TagInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'React{enter}')

      expect(input).toHaveValue('')
    })

    it('앞뒤 공백을 제거해야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<TagInput value={[]} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '  React  {enter}')

      expect(onChange).toHaveBeenCalledWith(['React'])
    })
  })

  describe('태그 삭제', () => {
    it('X 버튼 클릭으로 태그를 삭제해야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<TagInput value={['React', 'TypeScript']} onChange={onChange} />)

      const removeButtons = screen.getAllByRole('button', { name: /삭제/ })
      await user.click(removeButtons[0])

      expect(onChange).toHaveBeenCalledWith(['TypeScript'])
    })

    it('Backspace로 마지막 태그를 삭제해야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<TagInput value={['React', 'TypeScript']} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.keyboard('{Backspace}')

      expect(onChange).toHaveBeenCalledWith(['React'])
    })

    it('입력 중일 때는 Backspace로 태그를 삭제하지 않아야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(<TagInput value={['React']} onChange={onChange} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'Type')
      await user.keyboard('{Backspace}')

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  describe('최대 태그 수', () => {
    it('maxTags에 도달하면 입력 필드를 비활성화해야 함', () => {
      render(
        <TagInput
          value={['React', 'TypeScript', 'Node']}
          onChange={vi.fn()}
          maxTags={3}
        />
      )

      expect(screen.getByRole('textbox')).toBeDisabled()
    })

    it('maxTags 미만이면 입력 필드가 활성화되어야 함', () => {
      render(
        <TagInput
          value={['React', 'TypeScript']}
          onChange={vi.fn()}
          maxTags={3}
        />
      )

      expect(screen.getByRole('textbox')).not.toBeDisabled()
    })
  })

  describe('자동완성', () => {
    it('suggestions가 있으면 자동완성 목록을 표시해야 함', async () => {
      const user = userEvent.setup()

      render(
        <TagInput
          value={[]}
          onChange={vi.fn()}
          suggestions={['React', 'Redux', 'React Native']}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'Re')

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument()
        expect(screen.getByText('Redux')).toBeInTheDocument()
        expect(screen.getByText('React Native')).toBeInTheDocument()
      })
    })

    it('자동완성 항목 클릭 시 태그를 추가해야 함', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()

      render(
        <TagInput
          value={[]}
          onChange={onChange}
          suggestions={['React', 'Redux']}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'Re')

      await waitFor(async () => {
        const suggestion = screen.getByText('React')
        await user.click(suggestion)
      })

      expect(onChange).toHaveBeenCalledWith(['React'])
    })

    it('이미 추가된 태그는 자동완성에서 숨겨야 함', async () => {
      const user = userEvent.setup()

      render(
        <TagInput
          value={['React']}
          onChange={vi.fn()}
          suggestions={['React', 'Redux']}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, 'Re')

      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'React' })).not.toBeInTheDocument()
        expect(screen.getByText('Redux')).toBeInTheDocument()
      })
    })
  })

  it('label이 있으면 표시해야 함', () => {
    render(<TagInput {...defaultProps} label="기술 스택" />)

    expect(screen.getByText('기술 스택')).toBeInTheDocument()
  })

  it('error 메시지가 있으면 표시해야 함', () => {
    render(<TagInput {...defaultProps} error="태그를 하나 이상 입력해주세요" />)

    expect(
      screen.getByText('태그를 하나 이상 입력해주세요')
    ).toBeInTheDocument()
  })
})
