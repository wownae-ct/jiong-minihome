"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { useWelcomeView } from "@/components/providers/tab";
import { WELCOME_SERVER_IMAGE_URL } from "./constants/welcomeConstants";

export function WelcomeSection() {
    const { setWelcomeDetail } = useWelcomeView();

    const handleLearnMore = () => {
        setWelcomeDetail(true);
    };

    return (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-4 sm:p-8 md:p-12 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            {/* 서버 인프라 이미지 */}
            <Image
                src={WELCOME_SERVER_IMAGE_URL}
                alt="Server infrastructure visualization"
                width={256}
                height={160}
                className="w-48 md:w-64 h-auto object-cover rounded-xl mb-6 opacity-70 grayscale hover:grayscale-0 transition-all duration-500"
            />

            {/* 제목 */}
            <h3 className="text-lg md:text-xl font-medium mb-2">
                Welcome to my Infrastructure Lab
            </h3>

            {/* 설명 */}
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm md:text-base">
                이곳은 IT 인프라 엔지니어 지옹의 작업 공간이자 기록소입니다.{" "}
                <br />
                안정적인 서비스 운영을 위한 기술적 고민들을 공유합니다.
            </p>

            {/* CTA 버튼 - 리액티브 전환 */}
            <button
                onClick={handleLearnMore}
                className="mt-8 text-primary font-bold flex items-center gap-1 hover:gap-3 transition-all group"
            >
                더 자세히 보기
                <Icon
                    name="arrow_forward"
                    className="group-hover:translate-x-1 transition-transform"
                />
            </button>
        </div>
    );
}
