"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
    useWelcomeSettings,
    useUpdateWelcomeSettings,
    WelcomeSkill,
    WelcomeValue,
} from "@/hooks/useWelcomeSettings";
import { useToast } from "@/components/providers/ToastProvider";

interface WelcomeEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WelcomeEditModal({ isOpen, onClose }: WelcomeEditModalProps) {
    const toast = useToast();
    const { data: settings, isLoading } = useWelcomeSettings();
    const updateMutation = useUpdateWelcomeSettings();

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [description, setDescription] = useState("");
    const [skills, setSkills] = useState<WelcomeSkill[]>([]);
    const [values, setValues] = useState<WelcomeValue[]>([]);

    // 설정 데이터로 폼 초기화
    useEffect(() => {
        if (settings) {
            setTitle(settings.title);
            setSubtitle(settings.subtitle);
            setDescription(settings.description);
            setSkills(settings.skills);
            setValues(settings.values);
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await updateMutation.mutateAsync({
                title,
                subtitle,
                description,
                skills,
                values,
            });
            toast.toast("소개 섹션이 수정되었습니다.", "success");
            onClose();
        } catch (error) {
            toast.toast(
                error instanceof Error ? error.message : "수정에 실패했습니다.",
                "error",
            );
        }
    };

    const handleAddSkill = () => {
        setSkills([...skills, { category: "", items: [] }]);
    };

    const handleRemoveSkill = (index: number) => {
        setSkills(skills.filter((_, i) => i !== index));
    };

    const handleSkillCategoryChange = (index: number, category: string) => {
        const newSkills = [...skills];
        newSkills[index].category = category;
        setSkills(newSkills);
    };

    const handleSkillItemsChange = (index: number, items: string) => {
        const newSkills = [...skills];
        newSkills[index].items = items
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        setSkills(newSkills);
    };

    const handleAddValue = () => {
        setValues([...values, { icon: "star", title: "", description: "" }]);
    };

    const handleRemoveValue = (index: number) => {
        setValues(values.filter((_, i) => i !== index));
    };

    const handleValueChange = (
        index: number,
        field: keyof WelcomeValue,
        value: string,
    ) => {
        const newValues = [...values];
        newValues[index][field] = value;
        setValues(newValues);
    };

    if (isLoading) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="소개 섹션 편집"
            size="xl"
        >
            <form
                onSubmit={handleSubmit}
                className="space-y-6 max-h-[70vh] overflow-y-auto"
            >
                {/* 기본 정보 */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        기본 정보
                    </h3>
                    <Input
                        label="제목"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="안녕하세요, IT 인프라 엔지니어입니다."
                    />
                    <Input
                        label="부제목"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Welcome to my Infrastructure Lab"
                    />
                    <Textarea
                        label="소개글"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="자기소개를 입력하세요..."
                    />
                </div>

                {/* 기술 스택 */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            기술 스택
                        </h3>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleAddSkill}
                        >
                            <Icon name="add" size="sm" />
                            카테고리 추가
                        </Button>
                    </div>
                    {skills.map((skill, index) => (
                        <div
                            key={index}
                            className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <Input
                                    label="카테고리"
                                    value={skill.category}
                                    onChange={(e) =>
                                        handleSkillCategoryChange(
                                            index,
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Cloud"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveSkill(index)}
                                    className="mt-6 text-red-500"
                                >
                                    <Icon name="delete" size="sm" />
                                </Button>
                            </div>
                            <Input
                                label="기술 (쉼표로 구분)"
                                value={skill.items.join(", ")}
                                onChange={(e) =>
                                    handleSkillItemsChange(
                                        index,
                                        e.target.value,
                                    )
                                }
                                placeholder="AWS, GCP, Azure"
                            />
                        </div>
                    ))}
                </div>

                {/* 핵심 가치 */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            핵심 가치
                        </h3>
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={handleAddValue}
                        >
                            <Icon name="add" size="sm" />
                            가치 추가
                        </Button>
                    </div>
                    {values.map((value, index) => (
                        <div
                            key={index}
                            className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <Input
                                    label="아이콘 (Material Symbols)"
                                    value={value.icon}
                                    onChange={(e) =>
                                        handleValueChange(
                                            index,
                                            "icon",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="shield"
                                    className="w-32"
                                />
                                <Input
                                    label="제목"
                                    value={value.title}
                                    onChange={(e) =>
                                        handleValueChange(
                                            index,
                                            "title",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="안정성"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveValue(index)}
                                    className="mt-6 text-red-500"
                                >
                                    <Icon name="delete" size="sm" />
                                </Button>
                            </div>
                            <Textarea
                                label="설명"
                                value={value.description}
                                onChange={(e) =>
                                    handleValueChange(
                                        index,
                                        "description",
                                        e.target.value,
                                    )
                                }
                                rows={2}
                                placeholder="서비스의 안정적인 운영을 최우선으로 생각합니다."
                            />
                        </div>
                    ))}
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 sticky bottom-0 bg-white dark:bg-slate-800">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        취소
                    </Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                        <Icon name="save" size="sm" />
                        {updateMutation.isPending ? "저장 중..." : "저장하기"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
