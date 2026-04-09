"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useLightbox } from "@/hooks/useLightbox";
import { Portfolio, useDeletePortfolio } from "@/hooks/usePortfolios";
import { useToast } from "@/components/providers/ToastProvider";
import { motion } from "framer-motion";
import { parsePortfolioImages } from "@/lib/portfolio-images";
import { highlightCodeBlocks } from "@/lib/highlight-code";

interface PortfolioDetailProps {
    project: Portfolio;
    onBack: () => void;
    onEdit?: (portfolio: Portfolio) => void;
    onDelete?: () => void;
}

export function PortfolioDetail({
    project,
    onBack,
    onEdit,
    onDelete,
}: PortfolioDetailProps) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const proseRef = useRef<HTMLDivElement>(null);
    const { openLightbox } = useLightbox();
    const deleteMutation = useDeletePortfolio();
    const toast = useToast();
    const images = parsePortfolioImages(project.image);

    useEffect(() => {
        const container = proseRef.current;
        if (!container) return;

        const imgs = container.querySelectorAll('img');
        const handleClick = (e: Event) => {
            const img = e.currentTarget as HTMLImageElement;
            openLightbox({ src: img.src, alt: img.alt || '' });
        };

        imgs.forEach((img) => {
            img.style.cursor = 'pointer';
            img.style.touchAction = 'manipulation';
            img.addEventListener('click', handleClick);
        });

        return () => {
            imgs.forEach((img) => {
                img.removeEventListener('click', handleClick);
            });
        };
    }, [project.content, openLightbox]);

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync(project.id);
            toast.toast("포트폴리오가 삭제되었습니다.", "success");
            setShowDeleteConfirm(false);
            onDelete?.();
            onBack();
        } catch (error) {
            toast.toast(
                error instanceof Error ? error.message : "삭제에 실패했습니다.",
                "error",
            );
        }
    };
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
            {/* 헤더 - 뒤로가기 및 수정 */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                >
                    <Icon name="arrow_back" size="sm" />
                    목록으로 돌아가기
                </button>
                {isAdmin && (
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onEdit(project)}
                            >
                                <Icon name="edit" size="sm" />
                                수정
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Icon name="delete" size="sm" />
                            삭제
                        </Button>
                    </div>
                )}
            </div>

            {/* 프로젝트 이미지 */}
            {images.length > 0 ? (
                <div className={`grid ${images.length === 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-0`}>
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className="aspect-video bg-gradient-to-br from-primary/20 to-blue-600/20 overflow-hidden cursor-pointer touch-manipulation"
                            onClick={() => openLightbox({ src: img, alt: `${project.title} ${idx + 1}` })}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img}
                                alt={`${project.title} ${idx + 1}`}
                                className="w-full h-full object-cover hover:opacity-90 transition-opacity pointer-events-none"
                            />
                        </button>
                    ))}
                </div>
            ) : (
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center overflow-hidden">
                    <div className="text-center">
                        <Icon
                            name="folder_open"
                            className="text-primary/30 text-6xl"
                        />
                        <p className="text-slate-400 mt-2">프로젝트 이미지</p>
                    </div>
                </div>
            )}

            {/* 프로젝트 정보 */}
            <div className="p-4 sm:p-6 md:p-8">
                {/* 제목 및 뱃지 */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {project.title}
                    </h1>
                    {project.featured && (
                        <Badge variant="primary" className="shrink-0">
                            Featured
                        </Badge>
                    )}
                </div>

                {/* 간단 설명 */}
                {project.description && (
                    <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
                        {project.description}
                    </p>
                )}

                {/* 기술 스택 */}
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        기술 스택
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {(Array.isArray(project.tags) ? project.tags : []).map(
                            (tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1.5 text-sm bg-primary/10 text-primary dark:bg-primary/20 rounded-lg font-medium"
                                >
                                    {tag}
                                </span>
                            ),
                        )}
                    </div>
                </div>

                {/* 본문 콘텐츠 (리치 텍스트) */}
                {project.content && (
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                            상세 내용
                        </h3>
                        <div
                            ref={proseRef}
                            className="prose prose-slate dark:prose-invert max-w-none overflow-hidden"
                            dangerouslySetInnerHTML={{
                                __html: highlightCodeBlocks(project.content),
                            }}
                        />
                    </div>
                )}

                {/* 링크 버튼 */}
                <div className="flex flex-wrap gap-4">
                    {project.githubUrl && (
                        <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                        >
                            <Icon name="code" />
                            GitHub에서 보기
                        </a>
                    )}
                    {project.notionUrl && (
                        <a
                            href={project.notionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base bg-primary text-white rounded-xl hover:bg-blue-600 transition-colors"
                        >
                            <Icon name="description" />
                            Notion에서 보기
                        </a>
                    )}
                </div>
            </div>

            {/* 삭제 확인 다이얼로그 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowDeleteConfirm(false)}
                    />
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            포트폴리오 삭제
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            &quot;{project.title}&quot;을(를) 삭제하시겠습니까?
                            <br />
                            <span className="text-sm text-red-500">
                                이 작업은 되돌릴 수 없습니다.
                            </span>
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                취소
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="bg-red-500 hover:bg-red-600"
                            >
                                {deleteMutation.isPending
                                    ? "삭제 중..."
                                    : "삭제"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
