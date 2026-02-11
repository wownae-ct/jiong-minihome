"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, SignInInput } from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { Skeleton } from "@/components/ui/Skeleton";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const { error: showError } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignInInput>({
        resolver: zodResolver(signInSchema),
    });

    const onSubmit = async (data: SignInInput) => {
        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                showError("이메일 또는 비밀번호가 올바르지 않습니다");
                return;
            }

            router.push(callbackUrl);
            router.refresh();
        } catch {
            showError("로그인 중 오류가 발생했습니다");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuthSignIn = (provider: string) => {
        signIn(provider, { callbackUrl });
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="이메일"
                    type="email"
                    placeholder="email@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                />

                <Input
                    label="비밀번호"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    error={errors.password?.message}
                    {...register("password")}
                />

                <Button
                    type="submit"
                    className="w-full justify-center"
                    disabled={isLoading}
                >
                    {isLoading ? "로그인 중..." : "로그인"}
                </Button>
            </form>

            {/* 구분선 */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">
                        또는
                    </span>
                </div>
            </div>

            {/* OAuth 버튼 */}
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => handleOAuthSignIn("kakao")}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-[#FEE500] text-[#000000] font-medium hover:bg-[#FDD800] transition-colors"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.47 1.607 4.647 4.041 5.903l-.857 3.146c-.07.256.023.429.176.524.09.056.197.084.307.084.13 0 .263-.04.39-.127l3.693-2.46c.747.103 1.512.157 2.25.157 5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
                    </svg>
                    카카오로 로그인
                </button>

                <button
                    type="button"
                    onClick={() => handleOAuthSignIn("naver")}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-[#03C75A] text-white font-medium hover:bg-[#02B350] transition-colors"
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
                    </svg>
                    네이버로 로그인
                </button>

                <button
                    type="button"
                    onClick={() => handleOAuthSignIn("google")}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Google로 로그인
                </button>
            </div>

            {/* 아이디/비밀번호 찾기 */}
            <div className="mt-4 flex justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <Link
                    href="/find-email"
                    className="hover:text-primary hover:underline transition-colors"
                >
                    아이디 찾기
                </Link>
                <span>|</span>
                <Link
                    href="/find-password"
                    className="hover:text-primary hover:underline transition-colors"
                >
                    비밀번호 찾기
                </Link>
            </div>

            {/* 회원가입 링크 */}
            <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
                아직 계정이 없으신가요?{" "}
                <Link
                    href="/signup"
                    className="text-primary hover:underline font-medium"
                >
                    회원가입
                </Link>
            </p>
        </div>
    );
}

function LoginFormSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-4">
            <Skeleton height={60} />
            <Skeleton height={60} />
            <Skeleton height={44} />
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                {/* 로고 / 제목 */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-5xl font-display font-bold text-primary">
                            지옹&apos;s <br />
                            미니홈피
                        </h1>
                    </Link>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        로그인하고 다양한 기능을 이용해보세요
                    </p>
                </div>

                <Suspense fallback={<LoginFormSkeleton />}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    );
}
