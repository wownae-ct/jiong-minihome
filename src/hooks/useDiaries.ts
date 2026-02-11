'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface DiaryEntry {
  id: number
  userId: number
  title: string | null
  content: string
  mood: string | null
  weather: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
  user: {
    nickname: string
    profileImage: string | null
  }
}

async function fetchDiaries(): Promise<DiaryEntry[]> {
  const response = await fetch('/api/diary')
  if (!response.ok) {
    throw new Error('다이어리 로딩 실패')
  }
  return response.json()
}

async function createDiary(data: {
  title?: string
  content: string
  mood?: string
  weather?: string
  isPublic?: boolean
}): Promise<DiaryEntry> {
  const response = await fetch('/api/diary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('다이어리 작성 실패')
  }
  return response.json()
}

async function deleteDiary(id: number): Promise<void> {
  const response = await fetch(`/api/diary/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('다이어리 삭제 실패')
  }
}

export function useDiaries() {
  return useQuery({
    queryKey: ['diaries'],
    queryFn: fetchDiaries,
    staleTime: 2 * 60 * 1000, // 2분
  })
}

export function useLatestDiaries(count: number = 2) {
  const { data: diaries, ...rest } = useDiaries()
  return {
    data: diaries?.slice(0, count),
    ...rest,
  }
}

export function useCreateDiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDiary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
    },
  })
}

async function updateDiary({ id, data }: {
  id: number
  data: {
    title?: string
    content?: string
    mood?: string
    weather?: string
    isPublic?: boolean
  }
}): Promise<DiaryEntry> {
  const response = await fetch(`/api/diary/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('다이어리 수정 실패')
  }
  return response.json()
}

async function toggleDiaryVisibility({ id, currentIsPublic }: {
  id: number
  currentIsPublic: boolean
}): Promise<DiaryEntry> {
  const response = await fetch(`/api/diary/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPublic: !currentIsPublic }),
  })
  if (!response.ok) {
    throw new Error('다이어리 공개 설정 변경 실패')
  }
  return response.json()
}

export function useUpdateDiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateDiary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
    },
  })
}

export function useToggleDiaryVisibility() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleDiaryVisibility,
    onMutate: async ({ id, currentIsPublic }) => {
      await queryClient.cancelQueries({ queryKey: ['diaries'] })
      const previousDiaries = queryClient.getQueryData<DiaryEntry[]>(['diaries'])

      queryClient.setQueryData<DiaryEntry[]>(['diaries'], (old) =>
        old?.map((diary) =>
          diary.id === id ? { ...diary, isPublic: !currentIsPublic } : diary
        )
      )

      return { previousDiaries }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDiaries) {
        queryClient.setQueryData(['diaries'], context.previousDiaries)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
    },
  })
}

export function useDeleteDiary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteDiary,
    onMutate: async (deletedId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['diaries'] })
      const previousDiaries = queryClient.getQueryData<DiaryEntry[]>(['diaries'])

      queryClient.setQueryData<DiaryEntry[]>(['diaries'], (old) =>
        old?.filter((diary) => diary.id !== deletedId)
      )

      return { previousDiaries }
    },
    onError: (_err, _deletedId, context) => {
      // Rollback on error
      if (context?.previousDiaries) {
        queryClient.setQueryData(['diaries'], context.previousDiaries)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
    },
  })
}
