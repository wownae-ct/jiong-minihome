"use client";

import { Icon } from "@/components/ui/Icon";
import { useTab } from "@/components/providers/TabContext";
import { useLatestPortfolios } from "@/hooks/usePortfolios";

export function ProjectCard() {
    const { setActiveTab, setPortfolioDetail } = useTab();
    const { data: projects = [], isLoading } = useLatestPortfolios(3);

    const handleCardClick = () => {
        setActiveTab("portfolio");
    };

    const handleProjectClick = (e: React.MouseEvent, projectId: number) => {
        e.stopPropagation();
        setPortfolioDetail(projectId);
    };

    return (
        <div
            onClick={handleCardClick}
            className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:shadow-md transition-shadow cursor-pointer"
        >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-primary flex items-center justify-center">
                        <Icon name="terminal" />
                    </div>
                    <h4 className="font-bold">최근 프로젝트</h4>
                </div>
                <Icon
                    name="arrow_forward"
                    size="sm"
                    className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all"
                />
            </div>

            {/* 프로젝트 목록 */}
            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
                        />
                    ))}
                </div>
            ) : projects.length > 0 ? (
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    {projects.map((project) => (
                        <li
                            key={project.id}
                            onClick={(e) =>
                                project.id !== undefined &&
                                handleProjectClick(e, project.id)
                            }
                            className="flex justify-between items-center hover:text-primary transition-colors cursor-pointer py-1 -mx-2 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        >
                            <span className="truncate">{project.title}</span>
                            {project.featured && (
                                <span className="text-xs text-primary font-medium shrink-0 ml-2">
                                    Featured
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    아직 등록된 프로젝트가 없습니다.
                </p>
            )}
        </div>
    );
}
