import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ProfileProvider } from "@/components/providers/ProfileContext";
import { BgmProvider } from "@/components/providers/BgmContext";
import "./globals.css";

export const metadata: Metadata = {
    title: "지옹 미니홈피 | IT Infrastructure Engineer",
    description: "IT 인프라 엔지니어 지옹의 미니홈피입니다.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen transition-colors duration-300 font-sans">
                <SessionProvider>
                    <QueryProvider>
                        <ThemeProvider>
                            <ToastProvider>
                                <ProfileProvider>
                                    <BgmProvider>{children}</BgmProvider>
                                </ProfileProvider>
                            </ToastProvider>
                        </ThemeProvider>
                    </QueryProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
