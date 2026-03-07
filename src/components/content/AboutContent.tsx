'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/ui/Icon'
import { useProfile } from '@/components/providers/ProfileContext'

export function AboutContent() {
  const { profile, isLoading } = useProfile()

  const skills = [
    { category: '클라우드', items: ['AWS', 'GCP', 'Azure'] },
    { category: '컨테이너 & 오케스트레이션', items: ['Docker', 'Kubernetes', 'Helm'] },
    { category: 'IaC & 자동화', items: ['Terraform', 'Ansible', 'Jenkins', 'GitLab CI'] },
    { category: '모니터링', items: ['Prometheus', 'Grafana', 'ELK Stack', 'Datadog'] },
    { category: 'OS & 네트워크', items: ['Linux', 'Windows Server', 'TCP/IP', 'DNS'] },
  ]

  const values = [
    {
      icon: 'security',
      title: '안정성 우선',
      description: '시스템의 안정적인 운영을 최우선으로 생각합니다.',
    },
    {
      icon: 'speed',
      title: '자동화 추구',
      description: '반복적인 작업은 자동화하여 효율성을 높입니다.',
    },
    {
      icon: 'groups',
      title: '협업 중시',
      description: '개발팀과의 원활한 소통으로 DevOps 문화를 실천합니다.',
    },
    {
      icon: 'school',
      title: '지속적 학습',
      description: '빠르게 변화하는 기술 트렌드를 꾸준히 학습합니다.',
    },
  ]

  const serverImageUrl =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBpAQmgpKCQq95ZoNIIwzLRA8DRwh6rIOwnXnpucxvakzeSK1UIzGMOOQ898nH52Bf2IPaUDmciWyAitcgaQijeWJLUIZ_YuRAYDpmImEaOrFvyTDMF7mq6j73c-o16cRUbg-406likvCIy2-TYoc0ZW3dPUSd0fuzcD-PkCiu5yzzQ5wlGtJxxGRun8_79iQYulHi69TIGLx6iPxt75avBtRVrvSZot6jHoQYxxQ3DxbpNu7XIhTV48yJqCNtBci9NV4xB-mwTr9E'

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
          <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 뒤로가기 */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
      >
        <Icon name="arrow_back" size="sm" />
        홈으로 돌아가기
      </Link>

      {/* 메인 소개 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* 이미지 섹션 */}
          <div className="flex-shrink-0">
            <Image
              src={serverImageUrl}
              alt="Server infrastructure"
              width={300}
              height={200}
              className="rounded-xl object-cover"
            />
          </div>

          {/* 텍스트 섹션 */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {profile.name}
            </h1>
            <p className="text-xl text-primary font-medium mb-4">{profile.title}</p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              안녕하세요! 저는 안정적이고 확장 가능한 인프라를 설계하고 운영하는 것을 좋아하는
              IT 인프라 엔지니어입니다. 클라우드 네이티브 기술과 자동화를 통해 개발팀이
              비즈니스에 집중할 수 있는 환경을 만드는 것을 목표로 하고 있습니다.
            </p>
            <blockquote className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-l-4 border-primary italic text-slate-600 dark:text-slate-300">
              {profile.quote}
            </blockquote>
          </div>
        </div>
      </div>

      {/* 핵심 가치 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Icon name="favorite" className="text-primary" />
          핵심 가치
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl flex items-start gap-4"
            >
              <div className="p-2 bg-primary/10 rounded-lg text-primary flex items-center justify-center">
                <Icon name={value.icon} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {value.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 기술 스택 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Icon name="code" className="text-primary" />
          기술 스택
        </h2>
        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.category}>
              <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                {skill.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {skill.items.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 연락처 */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
          <Icon name="mail" className="text-primary" />
          연락처
        </h2>
        <div className="flex flex-wrap gap-4">
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Icon name="mail" size="sm" className="text-primary" />
              <span className="text-slate-600 dark:text-slate-400">{profile.email}</span>
            </a>
          )}
          {profile.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Icon name="code" size="sm" className="text-primary" />
              <span className="text-slate-600 dark:text-slate-400">GitHub</span>
            </a>
          )}
          {profile.linkedin && (
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Icon name="work" size="sm" className="text-primary" />
              <span className="text-slate-600 dark:text-slate-400">LinkedIn</span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
