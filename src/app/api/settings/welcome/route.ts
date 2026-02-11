import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, formatZodError } from "@/lib/api/helpers";
import prisma from "@/lib/prisma";
import { z } from "zod";

// 환영 섹션 설정 스키마
const welcomeSettingsSchema = z.object({
    title: z.string().max(200).optional(),
    subtitle: z.string().max(500).optional(),
    description: z.string().max(2000).optional(),
    skills: z
        .array(
            z.object({
                category: z.string(),
                items: z.array(z.string()),
            }),
        )
        .optional(),
    values: z
        .array(
            z.object({
                icon: z.string(),
                title: z.string(),
                description: z.string(),
            }),
        )
        .optional(),
});

const WELCOME_SETTINGS_KEY = "welcome_section";

// GET: 환영 섹션 설정 조회
export async function GET() {
    try {
        const setting = await prisma.siteSetting.findUnique({
            where: { settingKey: WELCOME_SETTINGS_KEY },
        });

        const defaultSettings = {
            title: "안녕하세요, IT 인프라 엔지니어 지옹입니다.",
            subtitle: "Welcome to my Infrastructure Lab",
            description:
                "클라우드 인프라 설계부터 CI/CD 파이프라인 구축, 모니터링 시스템 운영까지 서비스의 안정적인 운영을 위한 다양한 경험을 쌓아왔습니다. 이 공간에서는 제가 경험한 기술적 도전과 해결 과정들을 공유합니다.",
            skills: [
                { category: "Cloud", items: ["AWS", "GCP", "Azure"] },
                {
                    category: "Container & Orchestration",
                    items: ["Docker", "Kubernetes", "EKS", "GKE"],
                },
                {
                    category: "CI/CD",
                    items: ["Jenkins", "GitHub Actions", "ArgoCD", "GitOps"],
                },
                {
                    category: "IaC",
                    items: ["Terraform", "Ansible", "CloudFormation"],
                },
                {
                    category: "Monitoring",
                    items: ["Prometheus", "Grafana", "ELK Stack", "Datadog"],
                },
                {
                    category: "Database",
                    items: ["MySQL", "PostgreSQL", "Redis", "MongoDB"],
                },
            ],
            values: [
                {
                    icon: "shield",
                    title: "안정성",
                    description:
                        "서비스의 안정적인 운영을 최우선으로 생각합니다.",
                },
                {
                    icon: "bolt",
                    title: "자동화",
                    description:
                        "반복 작업을 자동화하여 효율성을 극대화합니다.",
                },
                {
                    icon: "trending_up",
                    title: "확장성",
                    description:
                        "성장에 대비한 확장 가능한 아키텍처를 설계합니다.",
                },
                {
                    icon: "security",
                    title: "보안",
                    description:
                        "보안을 고려한 인프라 설계와 운영을 추구합니다.",
                },
            ],
        };

        if (!setting || !setting.settingValue) {
            return NextResponse.json({ data: defaultSettings });
        }

        try {
            const parsedValue = JSON.parse(setting.settingValue);
            return NextResponse.json({
                data: { ...defaultSettings, ...parsedValue },
            });
        } catch {
            return NextResponse.json({ data: defaultSettings });
        }
    } catch (error) {
        console.error("환영 섹션 설정 조회 오류:", error);
        return NextResponse.json(
            { error: "설정을 불러오는데 실패했습니다." },
            { status: 500 },
        );
    }
}

// PUT: 환영 섹션 설정 수정 (관리자 전용)
export async function PUT(request: NextRequest) {
    try {
        const { session, error } = await requireAdmin();
        if (error) return error;

        const body = await request.json();
        const validation = welcomeSettingsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: formatZodError(validation.error) },
                { status: 400 },
            );
        }

        const setting = await prisma.siteSetting.upsert({
            where: { settingKey: WELCOME_SETTINGS_KEY },
            create: {
                settingKey: WELCOME_SETTINGS_KEY,
                settingValue: JSON.stringify(validation.data),
                description: "환영 섹션 설정",
            },
            update: {
                settingValue: JSON.stringify(validation.data),
            },
        });

        return NextResponse.json({
            data: JSON.parse(setting.settingValue || "{}"),
        });
    } catch (error) {
        console.error("환영 섹션 설정 수정 오류:", error);
        return NextResponse.json(
            { error: "설정 수정에 실패했습니다." },
            { status: 500 },
        );
    }
}
