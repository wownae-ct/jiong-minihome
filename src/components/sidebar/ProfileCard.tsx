"use client";

import Image from "next/image";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/ui/Icon";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { WriteButton } from "@/components/ui/WriteButton";
import { ProfileEditModal } from "@/components/admin/ProfileEditModal";
import { useProfile } from "@/components/providers/ProfileContext";
import { useAdminStatus } from "@/hooks/useAdminStatus";

export function ProfileCard() {
    const { data: session } = useSession();
    const { profile, isLoading, refreshProfile } = useProfile();
    const { status: adminStatus } = useAdminStatus();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const isAdmin = session?.user?.role === "admin";

    const statusColors = {
        online: "bg-green-500",
        away: "bg-yellow-500",
        offline: "bg-red-500",
    };

    const statusTitles = {
        online: "온라인",
        away: "자리 비움",
        offline: "오프라인",
    };

    const handleEditSuccess = () => {
        refreshProfile();
    };

    return (
        <div className="space-y-4 text-center relative">
            {/* 관리자 편집 버튼 */}
            {isAdmin && (
                <WriteButton
                    onClick={() => setIsEditModalOpen(true)}
                    title="프로필 수정"
                    className="absolute -top-2 -right-2"
                />
            )}

            {/* 프로필 이미지 */}
            <div className="relative inline-block">
                <div
                    className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-600 shadow-lg mx-auto cursor-pointer"
                    onClick={() => !isLoading && setIsLightboxOpen(true)}
                >
                    {isLoading ? (
                        <div className="w-full h-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    ) : (
                        <Image
                            src={profile.imageUrl}
                            alt={`Profile of ${profile.name}`}
                            width={160}
                            height={160}
                            className="w-full h-full object-cover"
                            priority
                        />
                    )}
                </div>
                {/* 온라인 상태 표시 */}
                <span
                    className={`absolute bottom-2 right-2 w-4 h-4 ${statusColors[adminStatus]} border-2 border-white dark:border-slate-800 rounded-full`}
                    title={statusTitles[adminStatus]}
                />
            </div>

            {/* 이름 & 직함 */}
            <div>
                {isLoading ? (
                    <>
                        <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded mx-auto mb-2 animate-pulse" />
                        <div className="h-5 w-40 bg-slate-200 dark:bg-slate-700 rounded mx-auto animate-pulse" />
                    </>
                ) : (
                    <>
                        <h2 className="text-xl font-bold">{profile.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {profile.title}
                        </p>
                    </>
                )}
            </div>

            {/* 인용문 */}
            <div className="p-4 bg-white dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 italic text-sm text-slate-600 dark:text-slate-300 relative">
                <Icon
                    name="format_quote"
                    className="absolute -top-3 -left-1 text-primary rotate-180"
                    size="lg"
                />
                <Icon
                    name="format_quote"
                    className="absolute -bottom-3 -right-1 text-primary "
                    size="lg"
                />
                {isLoading ? (
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                ) : (
                    profile.quote
                )}
            </div>

            {/* 소셜 링크 */}
            {!isLoading &&
                (profile.github || profile.linkedin || profile.website) && (
                    <div className="flex justify-center gap-3 pt-2">
                        {profile.github && (
                            <a
                                href={profile.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
                                title="GitHub"
                            >
                                <Icon name="code" size="sm" />
                            </a>
                        )}
                        {profile.linkedin && (
                            <a
                                href={profile.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
                                title="LinkedIn"
                            >
                                <Icon name="work" size="sm" />
                            </a>
                        )}
                        {profile.website && (
                            <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
                                title="웹사이트"
                            >
                                <Icon name="language" size="sm" />
                            </a>
                        )}
                        {profile.email && (
                            <a
                                href={`mailto:${profile.email}`}
                                className="p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
                                title="이메일"
                            >
                                <Icon name="mail" size="sm" />
                            </a>
                        )}
                    </div>
                )}

            {/* 프로필 수정 모달 */}
            <ProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                initialData={profile}
            />

            <ImageLightbox
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                src={profile.imageUrl}
                alt={`Profile of ${profile.name}`}
            />
        </div>
    );
}
