'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CareerItem } from '@/lib/validations/admin-content'

const defaultCareers: CareerItem[] = [
  {
    id: 1,
    company: '테크 스타트업',
    position: 'DevOps Engineer',
    period: '2022.03 - 현재',
    description: 'AWS 기반 인프라 운영 및 CI/CD 파이프라인 구축',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'GitHub Actions'],
    isCurrent: true,
  },
  {
    id: 2,
    company: 'IT 서비스 기업',
    position: 'System Engineer',
    period: '2020.01 - 2022.02',
    description: 'Linux 서버 운영 및 모니터링 시스템 구축',
    skills: ['Linux', 'Docker', 'Prometheus', 'Ansible'],
    isCurrent: false,
  },
]

async function fetchCareers(): Promise<CareerItem[]> {
  const response = await fetch('/api/admin/content?type=careers')
  if (!response.ok) {
    throw new Error('경력 정보 로딩 실패')
  }
  const { data } = await response.json()
  return data && data.length > 0 ? data : defaultCareers
}

async function updateCareers(careers: CareerItem[]): Promise<void> {
  const response = await fetch('/api/admin/content', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'careers', data: careers }),
  })
  if (!response.ok) {
    throw new Error('경력 정보 저장 실패')
  }
}

export function useCareers() {
  return useQuery({
    queryKey: ['careers'],
    queryFn: fetchCareers,
    staleTime: 5 * 60 * 1000, // 5분
  })
}

export function useUpdateCareers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCareers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careers'] })
    },
  })
}
