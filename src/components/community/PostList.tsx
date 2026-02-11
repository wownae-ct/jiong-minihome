"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { LikeButton } from "@/components/common/LikeButton";
import { Pagination } from "@/components/ui/Pagination";
import { SkeletonPost } from "@/components/ui/Skeleton";
import { useState } from "react";

interface PostData {
    id: number;
    title: string;
    content: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    isPinned: boolean;
    createdAt: string;
    guestName?: string | null;
    user: {
        id: number;
        nickname: string;
        profileImage: string | null;
    } | null;
    category: {
        id: number;
        name: string;
        slug: string;
    };
}

interface PostsResponse {
    posts: PostData[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

async function fetchPosts(
    page: number,
    category?: string,
    search?: string,
    searchType?: string,
): Promise<PostsResponse> {
    const params = new URLSearchParams({ page: String(page), limit: "5" });
    if (category) params.set("category", category);
    if (search) {
        params.set("search", search);
        params.set("searchType", searchType || "title");
    }

    const response = await fetch(`/api/posts?${params}`);
    if (!response.ok) {
        throw new Error("Failed to fetch posts");
    }
    return response.json();
}

interface PostListProps {
    category?: string;
    onPostClick?: (postId: number, categorySlug: string) => void;
    onMemberClick?: (userId: number) => void;
    search?: string;
    searchType?: string;
}

export function PostList({ category, onPostClick, onMemberClick, search, searchType }: PostListProps) {
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = useQuery({
        queryKey: ["posts", page, category, search, searchType],
        queryFn: () => fetchPosts(page, category, search, searchType),
    });

    if (error) {
        return (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                게시글을 불러오는데 실패했습니다.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {search && !isLoading && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                    &ldquo;{search}&rdquo; 검색 결과 ({data?.pagination.total || 0}건)
                </div>
            )}
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonPost key={i} />
                ))
            ) : data?.posts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    아직 게시글이 없습니다.
                </div>
            ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {data?.posts.map((post) => (
                        <PostItem
                            key={post.id}
                            post={post}
                            onPostClick={onPostClick}
                            onMemberClick={onMemberClick}
                        />
                    ))}
                </div>
            )}

            {data && data.pagination.totalPages > 1 && (
                <div className="pt-4">
                    <Pagination
                        currentPage={page}
                        totalPages={data.pagination.totalPages}
                        onPageChange={setPage}
                    />
                </div>
            )}
        </div>
    );
}

function getCategoryColorClass(slug: string): string {
    switch (slug) {
        case "free":
            return "text-emerald-400 dark:text-emerald-400";
        case "info":
            return "text-violet-400 dark:text-violet-400";
        case "qna":
            return "text-amber-500 dark:text-amber-400";
        default:
            return "text-slate-400 dark:text-slate-400";
    }
}

function PostItem({
    post,
    onPostClick,
    onMemberClick,
}: {
    post: PostData;
    onPostClick?: (postId: number, categorySlug: string) => void;
    onMemberClick?: (userId: number) => void;
}) {
    const formattedDate = new Date(post.createdAt).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
    });

    const authorName = post.user?.nickname || post.guestName || "알 수 없음";

    const handleClick = () => {
        if (onPostClick) {
            onPostClick(post.id, post.category.slug);
        }
    };

    const renderAuthor = () => {
        if (post.user && onMemberClick) {
            return (
                <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onMemberClick(post.user!.id); }}
                    className="hover:text-primary hover:underline transition-colors"
                >
                    {post.user.nickname}
                </button>
            );
        }
        return <span>{authorName}</span>;
    };

    const content = (
        <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {post.isPinned && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                            공지
                        </span>
                    )}
                    <span
                        className={`text-xs font-medium ${getCategoryColorClass(post.category.slug)}`}
                    >
                        [{post.category.name}]
                    </span>
                </div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {post.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    {renderAuthor()}
                    <span>{formattedDate}</span>
                    <span className="flex items-center gap-1">
                        <Icon name="visibility" size="sm" />
                        {post.viewCount}
                    </span>
                    <span className="flex items-center gap-1">
                        <Icon name="chat_bubble_outline" size="sm" />
                        {post.commentCount}
                    </span>
                    <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                        <LikeButton targetType="post" targetId={post.id} initialCount={post.likeCount} size="sm" />
                    </div>
                </div>
            </div>
        </div>
    );

    if (onPostClick) {
        return (
            <div
                onClick={handleClick}
                className="block py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-4 px-4 transition-colors cursor-pointer"
            >
                {content}
            </div>
        );
    }

    return (
        <Link
            href={`/community/${post.category.slug}/${post.id}`}
            className="block py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-4 px-4 transition-colors"
        >
            {content}
        </Link>
    );
}
