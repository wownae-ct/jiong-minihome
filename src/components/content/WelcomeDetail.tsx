"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useTab } from "@/components/providers/TabContext";
import { useWelcomeSettings } from "@/hooks/useWelcomeSettings";
import { WelcomeEditModal } from "@/components/admin/WelcomeEditModal";

export function WelcomeDetail() {
    const { goBack, setActiveTab } = useTab();
    const { data: session } = useSession();
    const { data: settings, isLoading } = useWelcomeSettings();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isAdmin = session?.user?.role === "admin";

    // 헤더용 네트워크/클라우드 이미지 (WelcomeSection과 다른 이미지 사용)
    const headerImageUrl =
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop";

    // 로딩 중일 때 기본값 사용
    const skills = settings?.skills || [];
    const values = settings?.values || [];
    const title =
        settings?.title || "안녕하세요, IT 인프라 엔지니어 지옹입니다.";
    const description = settings?.description || "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
            {/* 헤더 */}
            <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 via-blue-500/10 to-purple-500/20">
                <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                        src={headerImageUrl}
                        alt="Network and cloud infrastructure"
                        width={1200}
                        height={400}
                        className="w-full h-full object-cover opacity-60"
                    />
                </div>
                {/* 뒤로가기 버튼 */}
                <button
                    onClick={goBack}
                    className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                >
                    <Icon name="arrow_back" size="md" />
                </button>
                {/* 관리자 편집 버튼 */}
                {isAdmin && (
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        title="소개 섹션 편집"
                    >
                        <Icon name="edit" size="md" />
                    </button>
                )}
            </div>

            {/* 본문 */}
            <div className="p-4 sm:p-6 md:p-8 space-y-8">
                {isLoading ? (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                    </div>
                ) : (
                    <>
                        {/* 소개 */}
                        <section>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                                {title.includes("지옹") ? (
                                    <>
                                        {title.split("지옹")[0]}
                                        <span className="text-primary">
                                            지옹
                                        </span>
                                        {title.split("지옹")[1]}
                                    </>
                                ) : (
                                    title
                                )}
                            </h1>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {description}
                            </p>
                        </section>

                        {/* 핵심 가치 */}
                        {values.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <Icon
                                        name="star"
                                        className="text-primary"
                                    />
                                    핵심 가치
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {values.map((value, index) => (
                                        <motion.div
                                            key={value.title}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg">
                                                    <Icon
                                                        name={value.icon}
                                                        className="text-primary"
                                                    />
                                                </div>
                                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {value.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {value.description}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 기술 스택 */}
                        {skills.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                                    <Icon
                                        name="code"
                                        className="text-primary"
                                    />
                                    기술 스택
                                </h2>
                                <div className="space-y-4">
                                    {skills.map((skill, index) => (
                                        <motion.div
                                            key={skill.category}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                                                {skill.category}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {skill.items.map((item) => (
                                                    <span
                                                        key={item}
                                                        className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* CTA */}
                        <section className="pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setActiveTab("career")}
                                    className="bg-slate-700 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-bold shadow-md shadow-slate-700/20"
                                >
                                    <Icon name="work" size="sm" />
                                    경력 보기
                                </Button>
                                <Button
                                    onClick={() => setActiveTab("portfolio")}
                                >
                                    <Icon name="folder" size="sm" />
                                    포트폴리오 보기
                                </Button>
                            </div>
                        </section>
                    </>
                )}
            </div>

            {/* 편집 모달 */}
            <WelcomeEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />
        </motion.div>
    );
}
