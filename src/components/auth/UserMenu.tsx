"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useNavigation } from "@/components/providers/tab";
import { ProfileAvatar } from "@/components/common/ProfileAvatar";

export function UserMenu() {
    const { data: session } = useSession();
    const { setActiveTab } = useNavigation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSettingsClick = () => {
        setActiveTab("settings");
        setIsOpen(false);
    };

    const handleAdminClick = () => {
        setActiveTab("admin");
        setIsOpen(false);
    };

    if (!session) {
        return (
            <div className="flex items-center gap-2">
                <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                >
                    로그인
                </Link>
                <Link
                    href="/signup"
                    className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    회원가입
                </Link>
            </div>
        );
    }

    return (
        <div ref={menuRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
                <ProfileAvatar
                    src={session.user.image}
                    alt={session.user.name || "U"}
                    size="sm"
                />
                <Icon name="expand_more" size="sm" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                    {/* 사용자 정보 */}
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                            {session.user.name}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {session.user.email}
                        </p>
                    </div>

                    {/* 메뉴 항목 */}
                    <div className="py-2">
                        <button
                            onClick={handleSettingsClick}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                        >
                            <Icon name="settings" size="sm" />
                            설정
                        </button>
                        {session.user.role === "admin" && (
                            <button
                                onClick={handleAdminClick}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                            >
                                <Icon name="admin_panel_settings" size="sm" />
                                관리자
                            </button>
                        )}
                    </div>

                    {/* 로그아웃 */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-2">
                        <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Icon name="logout" size="sm" />
                            로그아웃
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
