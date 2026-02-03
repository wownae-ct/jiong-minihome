'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface WelcomeSkill {
  category: string
  items: string[]
}

export interface WelcomeValue {
  icon: string
  title: string
  description: string
}

export interface WelcomeSettings {
  title: string
  subtitle: string
  description: string
  skills: WelcomeSkill[]
  values: WelcomeValue[]
}

async function fetchWelcomeSettings(): Promise<WelcomeSettings> {
  const response = await fetch('/api/settings/welcome')
  if (!response.ok) {
    throw new Error('환영 섹션 설정 로딩 실패')
  }
  const { data } = await response.json()
  return data
}

async function updateWelcomeSettings(input: Partial<WelcomeSettings>): Promise<WelcomeSettings> {
  const response = await fetch('/api/settings/welcome', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '환영 섹션 설정 수정 실패')
  }
  const { data } = await response.json()
  return data
}

export function useWelcomeSettings() {
  return useQuery({
    queryKey: ['welcomeSettings'],
    queryFn: fetchWelcomeSettings,
    staleTime: 10 * 60 * 1000, // 10분
  })
}

export function useUpdateWelcomeSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWelcomeSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['welcomeSettings'] })
    },
  })
}
