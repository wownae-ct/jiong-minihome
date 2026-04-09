"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/ui/Icon";
import { WriteButton } from "@/components/ui/WriteButton";
import { DiaryWriteModal } from "@/components/admin/DiaryWriteModal";
import { useToast } from "@/components/providers/ToastProvider";
import { DeleteConfirmModal } from "@/components/common/DeleteConfirmModal";
import {
    useDiaries,
    useDeleteDiary,
    useToggleDiaryVisibility,
    DiaryEntry,
} from "@/hooks/useDiaries";
import { SearchFilter } from "@/components/common/SearchFilter";
import { motion, AnimatePresence } from "framer-motion";
import { Pagination } from "@/components/ui/Pagination";
import {
    moodIcons,
    moodLabels,
    weatherIcons,
    weatherLabels,
} from "./constants/diaryConstants";

const DIARY_PAGE_SIZE = 4;

function DiaryLoadingSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <span className="text-primary">다이어리</span>
                <span className="text-slate-400 dark:text-slate-500">
                    Diary
                </span>
            </h2>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 sm:p-6 animate-pulse"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-600 rounded" />
                            <div className="space-y-2">
                                <div className="w-32 h-5 bg-slate-200 dark:bg-slate-600 rounded" />
                                <div className="w-20 h-4 bg-slate-200 dark:bg-slate-600 rounded" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="w-full h-4 bg-slate-200 dark:bg-slate-600 rounded" />
                            <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-600 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface DiaryEntryCardProps {
    entry: DiaryEntry;
    isAdmin: boolean;
    onDelete: (entry: DiaryEntry) => void;
    onEdit: (entry: DiaryEntry) => void;
    onToggleVisibility: (entry: DiaryEntry) => void;
}

function DiaryEntryCard({
    entry,
    isAdmin,
    onDelete,
    onEdit,
    onToggleVisibility,
}: DiaryEntryCardProps) {
    const date = new Date(entry.createdAt);
    const formattedDate = date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
    });

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`rounded-xl p-4 sm:p-6 ${!entry.isPublic ? "bg-slate-100/80 dark:bg-slate-700/30 border border-dashed border-slate-300 dark:border-slate-600" : "bg-slate-50 dark:bg-slate-700/50"}`}
        >
            <div className="mb-4">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                                {date.getDate()}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                {date.toLocaleDateString("ko-KR", {
                                    month: "short",
                                })}
                            </div>
                        </div>
                        <div className="min-w-0">
                            <div
                                data-testid="diary-title-row"
                                className="flex items-center gap-1.5"
                            >
                                {!entry.isPublic && (
                                    <span
                                        className="text-slate-400"
                                        title="비공개"
                                    >
                                        <Icon name="lock" size="sm" />
                                    </span>
                                )}
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {entry.title || formattedDate}
                                </h3>
                                {entry.mood && moodIcons[entry.mood] && (
                                    <span
                                        className="flex items-center text-yellow-500"
                                        title={moodLabels[entry.mood]}
                                    >
                                        <Icon name={moodIcons[entry.mood]} />
                                    </span>
                                )}
                                {entry.weather &&
                                    weatherIcons[entry.weather] && (
                                        <span
                                            className="flex items-center text-blue-400"
                                            title={
                                                weatherLabels[entry.weather]
                                            }
                                        >
                                            <Icon
                                                name={
                                                    weatherIcons[
                                                        entry.weather
                                                    ]
                                                }
                                            />
                                        </span>
                                    )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {entry.user?.nickname}
                            </p>
                        </div>
                    </div>
                    {isAdmin && (
                        <div
                            data-testid="admin-actions"
                            className="flex items-center gap-1 shrink-0"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleVisibility(entry);
                                }}
                                className="p-1 text-slate-400 hover:text-primary transition-colors"
                                title={
                                    entry.isPublic
                                        ? "비공개로 전환"
                                        : "공개로 전환"
                                }
                            >
                                <Icon
                                    name={
                                        entry.isPublic
                                            ? "visibility"
                                            : "visibility_off"
                                    }
                                    size="sm"
                                />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(entry);
                                }}
                                className="p-1 text-slate-400 hover:text-primary transition-colors"
                                title="수정"
                            >
                                <Icon name="edit" size="sm" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(entry);
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                                title="삭제"
                            >
                                <Icon name="delete" size="sm" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {entry.content}
            </p>
        </motion.article>
    );
}

function DiaryDeletePreview({ entry }: { entry: DiaryEntry }) {
    return (
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm">
            <p className="font-medium text-slate-900 dark:text-slate-100">
                {entry.title || "제목 없음"}
            </p>
            <p className="text-slate-500 dark:text-slate-400 truncate">
                {entry.content.slice(0, 100)}
            </p>
        </div>
    );
}

export function DiaryContent() {
    const { data: session } = useSession();
    const { success, error: showError } = useToast();
    const { data: entries = [], isLoading, refetch } = useDiaries();
    const deleteDiaryMutation = useDeleteDiary();

    const toggleVisibilityMutation = useToggleDiaryVisibility();

    const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<DiaryEntry | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DiaryEntry | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [page, setPage] = useState(1);

    const isAdmin = session?.user?.role === "admin";

    const allMoods = useMemo(() => {
        const moodSet = new Set<string>();
        entries.forEach((entry) => {
            if (entry.mood) moodSet.add(entry.mood);
        });
        return Array.from(moodSet);
    }, [entries]);

    const filteredEntries = useMemo(() => {
        return entries.filter((entry) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = entry.title?.toLowerCase().includes(query);
                const matchesContent = entry.content
                    .toLowerCase()
                    .includes(query);
                if (!matchesTitle && !matchesContent) return false;
            }
            if (selectedMoods.length > 0) {
                if (!entry.mood || !selectedMoods.includes(entry.mood))
                    return false;
            }
            return true;
        });
    }, [entries, searchQuery, selectedMoods]);

    // 페이징
    const totalPages = Math.ceil(filteredEntries.length / DIARY_PAGE_SIZE);
    const paginatedEntries = useMemo(() => {
        const start = (page - 1) * DIARY_PAGE_SIZE;
        return filteredEntries.slice(start, start + DIARY_PAGE_SIZE);
    }, [filteredEntries, page]);

    const handleEdit = (entry: DiaryEntry) => {
        setEditTarget(entry);
    };

    const handleToggleVisibility = (entry: DiaryEntry) => {
        toggleVisibilityMutation.mutate(
            { id: entry.id, currentIsPublic: entry.isPublic },
            {
                onSuccess: () => {
                    success(
                        entry.isPublic
                            ? "비공개로 전환되었습니다"
                            : "공개로 전환되었습니다",
                    );
                },
                onError: () => {
                    showError("공개 설정 변경 중 오류가 발생했습니다");
                },
            },
        );
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteDiaryMutation.mutateAsync(deleteTarget.id);
            success("다이어리가 삭제되었습니다");
        } catch {
            showError("삭제 중 오류가 발생했습니다");
        } finally {
            setDeleteTarget(null);
        }
    };

    const handleMoodToggle = (mood: string) => {
        setSelectedMoods((prev) =>
            prev.includes(mood)
                ? prev.filter((m) => m !== mood)
                : [...prev, mood],
        );
        setPage(1);
    };

    const handleClearFilters = () => {
        setSearchQuery("");
        setSelectedMoods([]);
        setPage(1);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setPage(1);
    };

    if (isLoading) return <DiaryLoadingSkeleton />;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-700 relative">
            {isAdmin && (
                <WriteButton
                    onClick={() => setIsWriteModalOpen(true)}
                    title="다이어리 쓰기"
                    className="absolute top-4 right-4"
                />
            )}

            <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                <span className="text-primary">다이어리</span>
                <span className="text-slate-400 dark:text-slate-500">
                    Diary
                </span>
            </h2>

            {entries.length > 0 && (
                <div className="mb-6 space-y-1">
                    <SearchFilter
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchChange}
                        placeholder="다이어리 검색..."
                    />
                    {allMoods.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {allMoods.map((mood) => (
                                <button
                                    key={mood}
                                    onClick={() => handleMoodToggle(mood)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-lg transition-colors ${
                                        selectedMoods.includes(mood)
                                            ? "bg-primary text-white"
                                            : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                                    }`}
                                >
                                    <Icon
                                        name={moodIcons[mood] || "mood"}
                                        size="sm"
                                    />
                                    {moodLabels[mood] || mood}
                                </button>
                            ))}
                            {(searchQuery || selectedMoods.length > 0) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-2.5 py-0.5 text-xs text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <Icon name="refresh" size="sm" />
                                    초기화
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {filteredEntries.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <Icon
                        name="auto_stories"
                        size="xl"
                        className="mb-4 opacity-50"
                    />
                    {searchQuery || selectedMoods.length > 0 ? (
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
                            <p>아직 공개된 다이어리가 없습니다.</p>
                            {isAdmin && (
                                <button
                                    onClick={() => setIsWriteModalOpen(true)}
                                    className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    첫 다이어리 작성하기
                                </button>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <motion.div layout className="space-y-6">
                    <AnimatePresence>
                        {paginatedEntries.map((entry) => (
                            <DiaryEntryCard
                                key={entry.id}
                                entry={entry}
                                isAdmin={isAdmin}
                                onDelete={setDeleteTarget}
                                onEdit={handleEdit}
                                onToggleVisibility={handleToggleVisibility}
                            />
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

            <DiaryWriteModal
                isOpen={isWriteModalOpen || !!editTarget}
                onClose={() => {
                    setIsWriteModalOpen(false);
                    setEditTarget(null);
                }}
                onSuccess={() => refetch()}
                editEntry={editTarget || undefined}
            />

            <DeleteConfirmModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="다이어리 삭제"
                message="정말 이 다이어리를 삭제하시겠습니까?"
                isLoading={deleteDiaryMutation.isPending}
                preview={deleteTarget ? <DiaryDeletePreview entry={deleteTarget} /> : undefined}
            />
        </div>
    );
}
