// 네비게이션 아이템 타입
export interface NavItem {
  id: string;
  label: string;
  href: string;
  badge?: {
    text: string;
    variant: 'orange' | 'red' | 'green';
    pulse?: boolean;
  };
}

// 프로젝트 타입
export interface Project {
  id: string;
  title: string;
  date: string;
}

// 다이어리 항목 타입
export interface DiaryEntry {
  id: string;
  content: string;
}

// 방문자 통계 타입
export interface VisitorStats {
  today: number;
  total: number;
}

// 프로필 정보 타입
export interface ProfileInfo {
  name: string;
  title: string;
  quote: string;
  email: string;
  github: string;
  imageUrl: string;
}

// 네비게이션 데이터
export const navItems: NavItem[] = [
  { id: 'intro', label: '소개', href: '/' },
  { id: 'career', label: '경력', href: '/career' },
  { id: 'portfolio', label: '포트폴리오', href: '/portfolio' },
  { id: 'community', label: '커뮤니티', href: '/community' },
  { id: 'diary', label: '다이어리', href: '/diary' },
  { id: 'guestbook', label: '방명록', href: '/guestbook' },
];

// 프로필 데이터
export const profileData: ProfileInfo = {
  name: 'Jiyong Kim',
  title: 'Infrastructure Engineer',
  quote: '"상상이 현실이 되는 안정적인 인프라를 구축합니다."',
  email: 'jiyong@example.com',
  github: 'github.com/jiyong-it',
  imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC72xDnUimVvNwmArNQvJ-19hkIZhiZSTKWsBPvTekaii_aUK5P-CGeTSp0dlD3yLsvUkz3kiof-YOcvRD0UnV30eEk8QX1uQKRCaMkfwBi44BCzplIFChmbGQWVGFJCkE0kej91QQ86hyyuNzVCuM_80S0Ose4olzsZpYbBcVbYe0V08vMjK2mpPHfLIT1PJKnqVqdMptBxE5YgUg1QOqjBj2kM0Wfw-tRx2xtnBnb2uHew9BYa4vwUX2uaBWRDD9bNI5z7Gje9Pg',
};

// 프로젝트 데이터
export const projectsData: Project[] = [
  { id: '1', title: 'AWS 클라우드 마이그레이션', date: '2023.10' },
  { id: '2', title: 'K8s 클러스터 최적화', date: '2023.08' },
];

// 다이어리 데이터
export const diaryData: DiaryEntry[] = [
  { id: '1', content: '오늘은 가용 영역(AZ) 장애 대응 훈련...' },
  { id: '2', content: '인프라 엔지니어가 되길 잘했다는 생각...' },
];

// 방문자 통계 데이터
export const visitorStats: VisitorStats = {
  today: 24,
  total: 1254,
};
