'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PortfolioCreateInput, PortfolioUpdateInput } from '@/lib/validations/portfolio'
import { defaultProjects } from './data/defaultPortfolios'

export interface Portfolio {
  id: number
  userId: number
  title: string
  content: string
  description: string | null
  image: string | null
  githubUrl: string | null
  notionUrl: string | null
  featured: boolean | null
  isDeleted: boolean | null
  sortOrder: number | null
  isDraft: boolean | null
  draftData: string | null
  draftAt: string | null
  createdAt: string | null
  updatedAt: string | null
  tags: string[]
  user?: {
    id: number
    nickname: string
  }
}

export interface DraftData {
  title?: string
  content?: string
  description?: string
  image?: string | null
  githubUrl?: string
  notionUrl?: string
  featured?: boolean
  tags?: string[]
}

async function fetchPortfolios(): Promise<Portfolio[]> {
  const response = await fetch('/api/portfolios')
  if (!response.ok) {
    throw new Error('포트폴리오 로딩 실패')
  }
  const { data } = await response.json()
  return data && data.length > 0 ? data : defaultProjects
}

async function fetchPortfolioById(id: number): Promise<Portfolio> {
  const response = await fetch(`/api/portfolios/${id}`)
  if (!response.ok) {
    throw new Error('포트폴리오 로딩 실패')
  }
  const { data } = await response.json()
  return data
}

async function createPortfolio(input: PortfolioCreateInput): Promise<Portfolio> {
  const response = await fetch('/api/portfolios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '포트폴리오 생성 실패')
  }
  const { data } = await response.json()
  return data
}

async function updatePortfolio({
  id,
  ...input
}: PortfolioUpdateInput & { id: number }): Promise<Portfolio> {
  const response = await fetch(`/api/portfolios/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '포트폴리오 수정 실패')
  }
  const { data } = await response.json()
  return data
}

async function deletePortfolio(id: number): Promise<void> {
  const response = await fetch(`/api/portfolios/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '포트폴리오 삭제 실패')
  }
}

export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: fetchPortfolios,
    staleTime: 5 * 60 * 1000,
  })
}

export function usePortfolioById(id: number | null) {
  const { data: portfolios } = usePortfolios()
  return portfolios?.find((p) => p.id === id) || null
}

export function usePortfolioDetail(id: number | null) {
  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => fetchPortfolioById(id!),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updatePortfolio,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio', data.id] })
    },
  })
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

export function useLatestPortfolios(count: number = 2) {
  const { data: portfolios, ...rest } = usePortfolios()
  return {
    data: portfolios?.slice(0, count),
    ...rest,
  }
}

// ============= 태그 관련 =============

export interface Tag {
  id: number
  name: string
  color: string | null
  count: number
  createdAt: string | null
}

async function fetchTags(): Promise<Tag[]> {
  const response = await fetch('/api/tags')
  if (!response.ok) {
    throw new Error('태그 로딩 실패')
  }
  const { data } = await response.json()
  return data
}

async function createTag(input: { name: string; color?: string }): Promise<Tag> {
  const response = await fetch('/api/tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '태그 생성 실패')
  }
  const { data } = await response.json()
  return data
}

async function updateTag({
  id,
  ...input
}: { id: number; name: string; color?: string }): Promise<Tag> {
  const response = await fetch(`/api/tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '태그 수정 실패')
  }
  const { data } = await response.json()
  return data
}

async function deleteTag(id: number): Promise<void> {
  const response = await fetch(`/api/tags/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '태그 삭제 실패')
  }
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
    },
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

// ============= 임시 저장 관련 =============

async function fetchDraft(id: number): Promise<{ id: number; draftData: DraftData | null; draftAt: string | null }> {
  const response = await fetch(`/api/portfolios/${id}/draft`)
  if (!response.ok) {
    throw new Error('임시 저장 데이터 로딩 실패')
  }
  const { data } = await response.json()
  return data
}

async function saveDraft({ id, data }: { id: number; data: DraftData }): Promise<{ id: number; draftData: DraftData; draftAt: string }> {
  const response = await fetch(`/api/portfolios/${id}/draft`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '임시 저장 실패')
  }
  const { data: result } = await response.json()
  return result
}

async function createDraft(data: DraftData): Promise<{ id: number; draftData: DraftData; draftAt: string }> {
  const response = await fetch('/api/portfolios/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '임시 저장 실패')
  }
  const { data: result } = await response.json()
  return result
}

async function clearDraft(id: number): Promise<void> {
  const response = await fetch(`/api/portfolios/${id}/draft`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '임시 저장 삭제 실패')
  }
}

export function useDraft(id: number | null) {
  return useQuery({
    queryKey: ['draft', id],
    queryFn: () => fetchDraft(id!),
    enabled: id !== null,
    staleTime: 0,
  })
}

export function useSaveDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveDraft,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['draft', variables.id] })
    },
  })
}

export function useCreateDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

export function useClearDraft() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: clearDraft,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['draft', id] })
    },
  })
}
