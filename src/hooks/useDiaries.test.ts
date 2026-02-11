import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useDiaries,
  useUpdateDiary,
  useToggleDiaryVisibility,
  DiaryEntry,
} from './useDiaries'

const mockFetch = vi.fn()
global.fetch = mockFetch

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const sampleEntry: DiaryEntry = {
  id: 1,
  userId: 1,
  title: '테스트 다이어리',
  content: '내용입니다',
  mood: 'happy',
  weather: 'sunny',
  isPublic: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  user: { nickname: 'admin', profileImage: null },
}

describe('useUpdateDiary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PUT /api/diary/[id]로 수정 요청을 보낸다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...sampleEntry, title: '수정됨' }),
    })

    const { result } = renderHook(() => useUpdateDiary(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: 1, data: { title: '수정됨', content: '수정 내용' } })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/diary/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '수정됨', content: '수정 내용' }),
    })
  })

  it('실패 시 에러를 던진다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: '수정 실패' }),
    })

    const { result } = renderHook(() => useUpdateDiary(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: 1, data: { content: '수정' } })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})

describe('useToggleDiaryVisibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PUT /api/diary/[id]로 isPublic 토글 요청을 보낸다', async () => {
    // 초기 다이어리 목록 fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([sampleEntry]),
    })

    const wrapper = createWrapper()

    // useDiaries로 데이터를 먼저 로드
    const { result: diariesResult } = renderHook(() => useDiaries(), { wrapper })

    await waitFor(() => {
      expect(diariesResult.current.data).toBeDefined()
    })

    // toggle 요청에 대한 mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...sampleEntry, isPublic: false }),
    })

    const { result } = renderHook(() => useToggleDiaryVisibility(), { wrapper })

    result.current.mutate({ id: 1, currentIsPublic: true })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/diary/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: false }),
    })
  })

  it('isPublic이 true면 false로, false면 true로 토글한다', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ ...sampleEntry, isPublic: false }]),
    })

    const wrapper = createWrapper()
    const { result: diariesResult } = renderHook(() => useDiaries(), { wrapper })

    await waitFor(() => {
      expect(diariesResult.current.data).toBeDefined()
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ ...sampleEntry, isPublic: true }),
    })

    const { result } = renderHook(() => useToggleDiaryVisibility(), { wrapper })

    result.current.mutate({ id: 1, currentIsPublic: false })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    // false → true로 토글해야 함
    expect(mockFetch).toHaveBeenCalledWith('/api/diary/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
    })
  })
})
