import { render, screen } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { PostSearchBar } from './PostSearchBar'

describe('PostSearchBar', () => {
  it('검색 입력 필드와 검색 유형 드롭다운을 렌더링해야 함', () => {
    render(<PostSearchBar onSearch={vi.fn()} />)

    expect(screen.getByPlaceholderText('검색어를 입력하세요')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('기본 검색 유형은 title이어야 함', () => {
    render(<PostSearchBar onSearch={vi.fn()} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('title')
  })

  it('드롭다운에 4가지 검색 유형이 있어야 함', () => {
    render(<PostSearchBar onSearch={vi.fn()} />)

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(4)
    expect(options[0]).toHaveTextContent('제목')
    expect(options[1]).toHaveTextContent('제목+댓글')
    expect(options[2]).toHaveTextContent('내용')
    expect(options[3]).toHaveTextContent('작성자')
  })

  it('Enter 키를 누르면 onSearch가 호출되어야 함', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<PostSearchBar onSearch={onSearch} />)

    const input = screen.getByPlaceholderText('검색어를 입력하세요')
    await user.clear(input)
    await user.type(input, '테스트')
    await user.keyboard('{Enter}')

    expect(onSearch).toHaveBeenCalledWith('테스트', 'title')
  })

  it('검색 버튼을 클릭하면 onSearch가 호출되어야 함', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<PostSearchBar onSearch={onSearch} />)

    const input = screen.getByPlaceholderText('검색어를 입력하세요')
    await user.clear(input)
    await user.type(input, '검색어')

    const searchButton = screen.getByRole('button', { name: '검색' })
    await user.click(searchButton)

    expect(onSearch).toHaveBeenCalledWith('검색어', 'title')
  })

  it('검색 유형을 변경할 수 있어야 함', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<PostSearchBar onSearch={onSearch} />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'author')

    const input = screen.getByPlaceholderText('검색어를 입력하세요')
    await user.clear(input)
    await user.type(input, '작성자명')
    await user.keyboard('{Enter}')

    expect(onSearch).toHaveBeenCalledWith('작성자명', 'author')
  })

  it('빈 검색어로 검색하면 onSearch가 빈 문자열로 호출되어야 함', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<PostSearchBar onSearch={onSearch} />)

    const searchButton = screen.getByRole('button', { name: '검색' })
    await user.click(searchButton)

    expect(onSearch).toHaveBeenCalledWith('', 'title')
  })

  it('검색 버튼에 whitespace-nowrap과 shrink-0 클래스가 적용되어야 함', () => {
    render(<PostSearchBar onSearch={vi.fn()} />)
    const searchButton = screen.getByRole('button', { name: '검색' })
    expect(searchButton.className).toContain('whitespace-nowrap')
    expect(searchButton.className).toContain('shrink-0')
  })
})
