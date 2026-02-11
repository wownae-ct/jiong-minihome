"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

interface CommentFormProps {
    postId: number;
    parentId?: number;
    onSuccess?: () => void;
    onCancel?: () => void;
    placeholder?: string;
}

export function CommentForm({
    postId,
    parentId,
    onSuccess,
    onCancel,
    placeholder = "댓글을 입력하세요",
}: CommentFormProps) {
    const { data: session } = useSession();
    const { success, error: showError } = useToast();
    const [content, setContent] = useState("");
    const [guestName, setGuestName] = useState("");
    const [guestPassword, setGuestPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isGuest = !session;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim()) {
            showError("댓글 내용을 입력해주세요");
            return;
        }

        if (isGuest) {
            if (!guestName.trim()) {
                showError("닉네임을 입력해주세요");
                return;
            }
            if (!guestPassword.trim() || guestPassword.length < 4) {
                showError("비밀번호는 최소 4자 이상이어야 합니다");
                return;
            }
        }

        setIsLoading(true);
        try {
            const body: Record<string, unknown> = { content, parentId };
            if (isGuest) {
                body.guestName = guestName;
                body.guestPassword = guestPassword;
            }

            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok) {
                showError(result.error || "댓글 작성에 실패했습니다");
                return;
            }

            success("댓글이 등록되었습니다");
            setContent("");
            if (isGuest) {
                setGuestName("");
                setGuestPassword("");
            }
            onSuccess?.();
        } catch {
            showError("댓글 작성 중 오류가 발생했습니다");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {isGuest && (
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        placeholder="닉네임"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="비밀번호 (삭제 시 필요)"
                        value={guestPassword}
                        onChange={(e) => setGuestPassword(e.target.value)}
                    />
                </div>
            )}
            <Textarea
                placeholder={placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        취소
                    </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                    {isLoading
                        ? "등록 중..."
                        : parentId
                          ? "답글 등록"
                          : "댓글 등록"}
                </Button>
            </div>
        </form>
    );
}
