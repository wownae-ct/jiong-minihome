"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    ReactNode,
} from "react";

export interface ProfileData {
    name: string;
    title: string;
    quote: string;
    email: string;
    github: string;
    linkedin: string;
    website: string;
    imageUrl: string;
}

interface ProfileContextType {
    profile: ProfileData;
    isLoading: boolean;
    refreshProfile: () => Promise<void>;
}

const defaultProfile: ProfileData = {
    name: "Jiong Lee",
    title: "Infrastructure Engineer",
    quote: '"상상이 현실이 되는 안정적인 인프라를 구축합니다."',
    email: "akttkf0305@naver.com",
    github: "github.com/jiong-it",
    linkedin: "",
    website: "",
    imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC72xDnUimVvNwmArNQvJ-19hkIZhiZSTKWsBPvTekaii_aUK5P-CGeTSp0dlD3yLsvUkz3kiof-YOcvRD0UnV30eEk8QX1uQKRCaMkfwBi44BCzplIFChmbGQWVGFJCkE0kej91QQ86hyyuNzVCuM_80S0Ose4olzsZpYbBcVbYe0V08vMjK2mpPHfLIT1PJKnqVqdMptBxE5YgUg1QOqjBj2kM0Wfw-tRx2xtnBnb2uHew9BYa4vwUX2uaBWRDD9bNI5z7Gje9Pg",
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [profile, setProfile] = useState<ProfileData>(defaultProfile);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        try {
            const response = await fetch("/api/profile");
            if (response.ok) {
                const data = await response.json();
                setProfile((prev) => ({
                    name: data.name || prev.name,
                    title: data.title || prev.title,
                    quote: data.quote || prev.quote,
                    email: data.email || prev.email,
                    github: data.github || prev.github,
                    linkedin: data.linkedin || "",
                    website: data.website || "",
                    imageUrl: data.imageUrl || prev.imageUrl,
                }));
            }
        } catch (error) {
            console.error("프로필 로딩 실패:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    return (
        <ProfileContext.Provider
            value={{ profile, isLoading, refreshProfile: fetchProfile }}
        >
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error("useProfile must be used within a ProfileProvider");
    }
    return context;
}
