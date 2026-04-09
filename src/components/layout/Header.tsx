"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/providers/ThemeProvider";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationDropdown } from "@/components/common/NotificationDropdown";
import { useNavigation } from "@/components/providers/tab";

export function Header() {
    const { toggleTheme } = useTheme();
    const { setActiveTab } = useNavigation();

    const handleLogoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setActiveTab("intro");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            {/* 로고 영역 */}
            <a
                href="/"
                onClick={handleLogoClick}
                className="flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
            >
                <h1 className="text-xl sm:text-2xl md:text-3xl font-display text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    지옹이 미니홈피
                    <Icon name="home" className="text-primary text-4xl" size="xl" />
                </h1>
            </a>

            {/* 우측 액션 영역 */}
            <div className="flex items-center gap-4 md:gap-6">
                {/* 알림 */}
                <NotificationDropdown />

                {/* 사용자 메뉴 */}
                <UserMenu />

                {/* 다크모드 토글 */}
                <Button
                    variant="icon"
                    onClick={toggleTheme}
                    aria-label="다크모드 전환"
                >
                    <Icon name="dark_mode" />
                </Button>
            </div>
        </header>
    );
}
