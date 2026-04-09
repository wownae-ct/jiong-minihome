'use client'

import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Icon } from '@/components/ui/Icon'
import { WriteButton } from '@/components/ui/WriteButton'
import { Badge } from '@/components/ui/Badge'
import { PortfolioWriteModal } from '@/components/admin/PortfolioWriteModal'
import { TagManagement } from '@/components/admin/TagManagement'
import { PortfolioDetail } from './PortfolioDetail'
import { usePortfolios, Portfolio } from '@/hooks/usePortfolios'
import { usePortfolioView } from '@/components/providers/tab'
import { AnimatePresence, motion } from 'framer-motion'
import { SearchFilter } from '@/components/common/SearchFilter'
import { Pagination } from '@/components/ui/Pagination'
import { getFirstImage } from '@/lib/portfolio-images'

const PORTFOLIO_PAGE_SIZE = 4

export function PortfolioContent() {
  const { data: session } = useSession()
  const { data: projects = [], isLoading, refetch } = usePortfolios()
  const { portfolioDetailId, setPortfolioDetail } = usePortfolioView()
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false)
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [page, setPage] = useState(1)

  const isAdmin = session?.user?.role === 'admin'

  // 선택된 프로젝트
  const selectedProject = useMemo(() => {
    if (portfolioDetailId === null) return null
    return projects.find((p) => p.id === portfolioDetailId) || null
  }, [portfolioDetailId, projects])

  // 모든 태그 추출
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    projects.forEach((project) => {
      if (Array.isArray(project.tags)) {
        project.tags.forEach((tag) => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [projects])

  // 필터링된 프로젝트
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // 검색어 필터
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = project.title.toLowerCase().includes(query)
        const matchesDescription = (project.description || '').toLowerCase().includes(query)
        if (!matchesTitle && !matchesDescription) return false
      }

      // 태그 필터
      if (selectedTags.length > 0) {
        const projectTags = Array.isArray(project.tags) ? project.tags : []
        const hasMatchingTag = selectedTags.some((tag) => projectTags.includes(tag))
        if (!hasMatchingTag) return false
      }

      return true
    })
  }, [projects, searchQuery, selectedTags])

  // 페이징
  const totalPages = Math.ceil(filteredProjects.length / PORTFOLIO_PAGE_SIZE)
  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * PORTFOLIO_PAGE_SIZE
    return filteredProjects.slice(start, start + PORTFOLIO_PAGE_SIZE)
  }, [filteredProjects, page])

  const handleWriteSuccess = () => {
    refetch()
    setEditingPortfolio(null)
  }

  const handleProjectClick = (project: Portfolio) => {
    if (project.id !== undefined) {
      setPortfolioDetail(project.id)
    }
  }

  const handleBackToList = () => {
    setPortfolioDetail(null)
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
    setPage(1)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
    setPage(1)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setPage(1)
  }

  const handleOpenWriteModal = (portfolio?: Portfolio) => {
    setEditingPortfolio(portfolio || null)
    setIsWriteModalOpen(true)
  }

  const handleCloseWriteModal = () => {
    setIsWriteModalOpen(false)
    setEditingPortfolio(null)
  }

  // 상세 보기 모드
  if (selectedProject) {
    return (
      <>
        <AnimatePresence mode="wait">
          <PortfolioDetail
            key={selectedProject.id}
            project={selectedProject}
            onBack={handleBackToList}
            onEdit={(portfolio) => {
              handleOpenWriteModal(portfolio)
            }}
          />
        </AnimatePresence>
        {/* 포트폴리오 수정 모달 (상세 보기에서도 사용) */}
        <PortfolioWriteModal
          isOpen={isWriteModalOpen}
          onClose={handleCloseWriteModal}
          portfolio={editingPortfolio}
          onSuccess={handleWriteSuccess}
        />
      </>
    )
  }

  // 목록 보기 모드
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700 relative">
      {/* 관리자 버튼 */}
      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2">
          {/* 태그 관리: WriteButton과 동일 프레임 (w-10 h-10 + rounded-xl + inline-flex center)
              → Material Symbols font-based icon의 baseline 비대칭으로 인한 치우침 방지 */}
          <button
            onClick={() => setIsTagManagementOpen(true)}
            title="태그 관리"
            aria-label="태그 관리"
            className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors shrink-0"
          >
            <Icon name="label" size="sm" className="text-slate-600 dark:text-slate-300" />
          </button>
          <WriteButton
            onClick={() => handleOpenWriteModal()}
            title="포트폴리오 작성"
          />
        </div>
      )}

      <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
        <span className="text-primary">포트폴리오</span>
        <span className="text-slate-400 dark:text-slate-500">Portfolio</span>
      </h2>

      {/* 검색 및 필터 */}
      {!isLoading && projects.length > 0 && (
        <SearchFilter
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          tags={allTags}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClearFilters={handleClearFilters}
          placeholder="프로젝트 검색..."
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-slate-200 dark:bg-slate-600" />
              <div className="p-5">
                <div className="h-6 bg-slate-200 dark:bg-slate-600 rounded w-2/3 mb-2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-full mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-600 rounded" />
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-600 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Icon name="search_off" size="xl" className="mx-auto mb-2" />
          {searchQuery || selectedTags.length > 0 ? (
            <>
              <p>검색 결과가 없습니다.</p>
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 text-primary hover:underline"
              >
                필터 초기화
              </button>
            </>
          ) : (
            <>
              <p>등록된 포트폴리오가 없습니다.</p>
              {isAdmin && (
                <button
                  onClick={() => handleOpenWriteModal()}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  프로젝트 추가하기
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <AnimatePresence>
            {paginatedProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => handleProjectClick(project)}
                className="group bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 hover:border-primary hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center relative overflow-hidden">
                  {getFirstImage(project.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getFirstImage(project.image)!}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Icon
                      name="folder_open"
                      size="xl"
                      className="text-primary/50 group-hover:text-primary transition-colors"
                    />
                  )}
                  {/* 호버 오버레이 */}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-primary/80 px-4 py-2 rounded-lg font-medium">
                      자세히 보기
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    {project.featured && <Badge variant="primary">Featured</Badge>}
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(Array.isArray(project.tags) ? project.tags : []).slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {Array.isArray(project.tags) && project.tags.length > 4 && (
                      <span className="px-2 py-0.5 text-xs text-slate-400">
                        +{project.tags.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {project.githubUrl && (
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Icon name="code" size="sm" />
                        GitHub
                      </span>
                    )}
                    {project.notionUrl && (
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Icon name="description" size="sm" />
                        Notion
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* 포트폴리오 작성/수정 모달 */}
      <PortfolioWriteModal
        isOpen={isWriteModalOpen}
        onClose={handleCloseWriteModal}
        portfolio={editingPortfolio}
        onSuccess={handleWriteSuccess}
      />

      {/* 태그 관리 모달 */}
      <TagManagement
        isOpen={isTagManagementOpen}
        onClose={() => setIsTagManagementOpen(false)}
      />
    </div>
  )
}
