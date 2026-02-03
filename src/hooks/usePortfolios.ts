'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PortfolioCreateInput, PortfolioUpdateInput } from '@/lib/validations/portfolio'

// 새 Portfolio 타입 (DB 기반)
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

// 임시 저장 데이터 타입
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

// 기본 프로젝트 데이터 (DB가 비어있을 때 사용)
const defaultProjects: Portfolio[] = [
  {
    id: 1,
    userId: 1,
    title: 'Kubernetes 클러스터 구축',
    content: '<p>AWS EKS 기반 프로덕션 Kubernetes 클러스터 설계 및 구축. 마이크로서비스 아키텍처 지원을 위한 서비스 메시 도입.</p>',
    description: 'AWS EKS 기반 프로덕션 Kubernetes 클러스터 설계 및 구축.',
    image: null,
    tags: ['AWS', 'EKS', 'Kubernetes', 'Istio', 'Helm'],
    githubUrl: 'https://github.com',
    notionUrl: null,
    featured: true,
    isDeleted: false,
    sortOrder: 0,
    isDraft: false,
    draftData: null,
    draftAt: null,
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 2,
    userId: 1,
    title: 'CI/CD 파이프라인 자동화',
    content: '<p>GitOps 기반 배포 자동화 시스템 구축. ArgoCD와 GitHub Actions를 활용한 완전 자동화된 배포 환경.</p>',
    description: 'GitOps 기반 배포 자동화 시스템 구축.',
    image: null,
    tags: ['ArgoCD', 'GitHub Actions', 'GitOps', 'Docker'],
    githubUrl: 'https://github.com',
    notionUrl: null,
    featured: true,
    isDeleted: false,
    sortOrder: 1,
    isDraft: false,
    draftData: null,
    draftAt: null,
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 3,
    userId: 1,
    title: '모니터링 시스템 구축',
    content: '<p>Prometheus + Grafana 기반 통합 모니터링 대시보드 구축. 알림 시스템 및 로그 수집 파이프라인 구현.</p>',
    description: 'Prometheus + Grafana 기반 통합 모니터링 대시보드 구축.',
    image: null,
    tags: ['Prometheus', 'Grafana', 'Loki', 'AlertManager'],
    githubUrl: '',
    notionUrl: null,
    featured: false,
    isDeleted: false,
    sortOrder: 2,
    isDraft: false,
    draftData: null,
    draftAt: null,
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 4,
    userId: 1,
    title: 'IaC 인프라 자동화',
    content: '<p>Terraform을 활용한 클라우드 인프라 코드화. 멀티 환경 관리 및 모듈화된 인프라 템플릿 개발.</p>',
    description: 'Terraform을 활용한 클라우드 인프라 코드화.',
    image: null,
    tags: ['Terraform', 'AWS', 'IaC', 'Ansible'],
    githubUrl: 'https://github.com',
    notionUrl: null,
    featured: false,
    isDeleted: false,
    sortOrder: 3,
    isDraft: false,
    draftData: null,
    draftAt: null,
    createdAt: null,
    updatedAt: null,
  },
]

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

// 포트폴리오 목록 조회
export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: fetchPortfolios,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 포트폴리오 상세 조회 (캐시된 목록에서 찾기)
export function usePortfolioById(id: number | null) {
  const { data: portfolios } = usePortfolios()
  return portfolios?.find((p) => p.id === id) || null
}

// 포트폴리오 상세 조회 (개별 API 호출)
export function usePortfolioDetail(id: number | null) {
  return useQuery({
    queryKey: ['portfolio', id],
    queryFn: () => fetchPortfolioById(id!),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
  })
}

// 포트폴리오 생성
export function useCreatePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

// 포트폴리오 수정
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

// 포트폴리오 삭제
export function useDeletePortfolio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

// 최근 포트폴리오 조회
export function useLatestPortfolios(count: number = 2) {
  const { data: portfolios, ...rest } = usePortfolios()
  return {
    data: portfolios?.slice(0, count),
    ...rest,
  }
}

// 태그 목록 조회
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

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: fetchTags,
    staleTime: 5 * 60 * 1000,
  })
}

// 태그 생성
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

// 태그 수정
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

// 태그 삭제
async function deleteTag(id: number): Promise<void> {
  const response = await fetch(`/api/tags/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '태그 삭제 실패')
  }
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

// ============= 임시 저장 관련 함수 =============

// 임시 저장 데이터 조회
async function fetchDraft(id: number): Promise<{ id: number; draftData: DraftData | null; draftAt: string | null }> {
  const response = await fetch(`/api/portfolios/${id}/draft`)
  if (!response.ok) {
    throw new Error('임시 저장 데이터 로딩 실패')
  }
  const { data } = await response.json()
  return data
}

// 임시 저장
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

// 새 포트폴리오 임시 저장 (아직 생성되지 않은 경우)
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

// 임시 저장 삭제
async function clearDraft(id: number): Promise<void> {
  const response = await fetch(`/api/portfolios/${id}/draft`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '임시 저장 삭제 실패')
  }
}

// 임시 저장 데이터 조회 훅
export function useDraft(id: number | null) {
  return useQuery({
    queryKey: ['draft', id],
    queryFn: () => fetchDraft(id!),
    enabled: id !== null,
    staleTime: 0, // 항상 최신 데이터
  })
}

// 임시 저장 훅
export function useSaveDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveDraft,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['draft', variables.id] })
    },
  })
}

// 새 포트폴리오 임시 저장 훅
export function useCreateDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDraft,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}

// 임시 저장 삭제 훅
export function useClearDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: clearDraft,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['draft', id] })
    },
  })
}

// 레거시 호환을 위한 별칭
export function useUpdatePortfolios() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // 레거시 코드 호환용 - 실제로는 사용하지 않음
      console.warn('useUpdatePortfolios is deprecated. Use useCreatePortfolio or useUpdatePortfolio instead.')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })
}
