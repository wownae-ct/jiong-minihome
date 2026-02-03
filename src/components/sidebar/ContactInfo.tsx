"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/ui/Icon";
import { ProfileEditModal } from "@/components/admin/ProfileEditModal";
import { useProfile } from "@/components/providers/ProfileContext";

export function ContactInfo() {
    const { data: session } = useSession();
    const { profile, isLoading, refreshProfile } = useProfile();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isAdmin = session?.user?.role === "admin";

    const handleEditSuccess = () => {
        refreshProfile();
    };

    // 표시할 연락처 정보가 없는 경우
    const hasContactInfo =
        profile.email || profile.github || profile.linkedin || profile.website;

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-40 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 w-36 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3 relative">
            {!hasContactInfo ? (
                <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                    {isAdmin ? (
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="text-primary hover:underline"
                        >
                            연락처 정보를 추가하세요
                        </button>
                    ) : (
                        "연락처 정보가 없습니다."
                    )}
                </div>
            ) : (
                <>
                    {/* 이메일 */}
                    {profile.email && (
                        <div className="flex items-center gap-3 text-sm">
                            <Icon name="mail" className="text-primary" />
                            <a
                                href={`mailto:${profile.email}`}
                                className="hover:text-primary transition-colors truncate"
                            >
                                {profile.email}
                            </a>
                        </div>
                    )}

                    {/* GitHub */}
                    {profile.github && (
                        <div className="flex items-center gap-3 text-sm">
                            <Icon name="code" className="text-primary" />
                            <a
                                href={profile.github}
                                className="underline hover:text-primary transition-colors truncate"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {profile.github.replace(/^https?:\/\//, "")}
                            </a>
                        </div>
                    )}

                    {/* LinkedIn */}
                    {profile.linkedin && (
                        <div className="flex items-center gap-3 text-sm">
                            <Icon name="work" className="text-primary" />
                            <a
                                href={profile.linkedin}
                                className="underline hover:text-primary transition-colors truncate"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {profile.linkedin.replace(/^https?:\/\//, "")}
                            </a>
                        </div>
                    )}

                    {/* Website */}
                    {profile.website && (
                        <div className="flex items-center gap-3 text-sm">
                            <Icon name="language" className="text-primary" />
                            <a
                                href={profile.website}
                                className="underline hover:text-primary transition-colors truncate"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {profile.website.replace(/^https?:\/\//, "")}
                            </a>
                        </div>
                    )}
                </>
            )}

            {/* 프로필 수정 모달 */}
            <ProfileEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                initialData={profile}
            />
        </div>
    );
}
