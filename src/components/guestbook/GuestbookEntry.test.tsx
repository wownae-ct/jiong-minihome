import { render, screen, waitFor } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";

vi.mock("next-auth/react", async () => {
    const actual = await vi.importActual("next-auth/react");
    return {
        ...actual,
        useSession: vi.fn(),
    };
});

vi.mock("@/components/providers/ToastProvider", () => ({
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
    useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("@/components/ui/Icon", () => ({
    Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock("@/components/ui/Modal", () => ({
    Modal: ({
        children,
        isOpen,
    }: {
        children: React.ReactNode;
        isOpen: boolean;
    }) => (isOpen ? <div data-testid="modal">{children}</div> : null),
}));

vi.mock("@/components/ui/Input", () => ({
    Input: (
        props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
    ) => <input {...props} />,
}));

vi.mock("@/components/ui/Button", () => ({
    Button: ({
        children,
        ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: string;
    }) => <button {...props}>{children}</button>,
}));

import { useSession } from "next-auth/react";
import { GuestbookEntry } from "./GuestbookEntry";

const baseEntry = {
    id: 1,
    content: "안녕하세요!",
    isPrivate: false,
    guestName: null,
    createdAt: "2025-01-01T00:00:00Z",
    userId: 1,
    user: {
        id: 1,
        nickname: "테스터",
        profileImage: null,
    },
};

describe("GuestbookEntry", () => {
    beforeEach(() => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: "unauthenticated",
            update: vi.fn(),
        });
    });

    it("일반 글의 내용을 기본 색상으로 표시해야 함", () => {
        render(<GuestbookEntry entry={baseEntry} />);

        const content = screen.getByText("안녕하세요!");
        expect(content).not.toHaveClass("text-slate-400");
        expect(content).not.toHaveClass("italic");
    });

    it("엔트리 루트 컨테이너에 상하 대칭 패딩이 적용되어야 함", () => {
        render(<GuestbookEntry entry={baseEntry} />);

        // 하단 경계선 div를 찾음 (border-b 클래스 보유)
        const content = screen.getByText("안녕하세요!");
        const root = content.closest('div.border-b') as HTMLElement;
        expect(root).not.toBeNull();

        // 상단 패딩 (엔트리 간 간격 확보)
        expect(root).toHaveClass('pt-3');
        expect(root).toHaveClass('sm:pt-4');

        // 하단 패딩 (기존 유지)
        expect(root).toHaveClass('pb-3');
        expect(root).toHaveClass('sm:pb-4');

        // 첫 엔트리는 상단 패딩 제거
        expect(root).toHaveClass('first:pt-0');

        // 마지막 엔트리는 하단 패딩과 보더 제거
        expect(root).toHaveClass('last:pb-0');
        expect(root).toHaveClass('last:border-b-0');
    });

    it("비밀글이고 열람 불가 시 옅은 회색 italic으로 표시해야 함", () => {
        const privateEntry = {
            ...baseEntry,
            isPrivate: true,
            content: "비밀글입니다.",
        };

        render(<GuestbookEntry entry={privateEntry} />);

        const content = screen.getByText("비밀글입니다.");
        expect(content).toHaveClass("text-slate-400");
        expect(content).toHaveClass("italic");
        expect(content).toHaveClass("sm:text-[13px]");
    });

    it("비밀글이지만 작성자 본인이 볼 때는 기본 색상으로 표시해야 함", () => {
        vi.mocked(useSession).mockReturnValue({
            data: {
                user: {
                    id: "1",
                    name: "테스터",
                    email: "test@test.com",
                    role: "user",
                },
                expires: "",
            },
            status: "authenticated",
            update: vi.fn(),
        });

        const privateEntry = {
            ...baseEntry,
            isPrivate: true,
            content: "비밀 내용입니다.",
        };

        render(<GuestbookEntry entry={privateEntry} />);

        const content = screen.getByText("비밀 내용입니다.");
        expect(content).not.toHaveClass("text-slate-400");
        expect(content).not.toHaveClass("italic");
    });

    it("비밀글에 자물쇠 아이콘이 표시되어야 함", () => {
        const privateEntry = {
            ...baseEntry,
            isPrivate: true,
            content: "비밀글입니다.",
        };

        render(<GuestbookEntry entry={privateEntry} />);

        expect(screen.getByTestId("icon-lock")).toBeInTheDocument();
    });

    describe("비회원 글 삭제", () => {
        const guestEntry = {
            id: 2,
            content: "비회원 글입니다",
            isPrivate: false,
            guestName: "방문자",
            createdAt: "2025-01-01T00:00:00Z",
            userId: null,
            user: null,
        };

        it("비밀번호가 틀리면 모달이 닫혀야 함", async () => {
            const user = userEvent.setup();

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: "비밀번호가 올바르지 않습니다" }),
            });

            render(<GuestbookEntry entry={guestEntry} />);

            // 삭제 버튼 클릭 → 모달 열림
            await user.click(screen.getByTestId("icon-delete"));
            expect(screen.getByTestId("modal")).toBeInTheDocument();

            // 비밀번호 입력 후 삭제 클릭
            const passwordInput = screen.getByPlaceholderText("작성 시 입력한 비밀번호");
            await user.clear(passwordInput);
            await user.type(passwordInput, "wrongpassword");
            await user.click(screen.getByText("삭제"));

            // 모달이 닫혀야 함
            await waitFor(() => {
                expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
            });
        });
    });
});
