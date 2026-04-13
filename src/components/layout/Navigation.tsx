'use client';

import { useNavigation, type TabId } from '@/components/providers/tab';
import { Badge } from '@/components/ui/Badge';

interface NavItem {
  id: TabId;
  label: string;
  badge?: {
    text: string;
    variant: 'orange' | 'red' | 'green';
    pulse?: boolean;
  };
}

const navItems: NavItem[] = [
  { id: 'intro', label: '소개' },
  { id: 'career', label: '경력' },
  { id: 'portfolio', label: '포트폴리오' },
  { id: 'community', label: '커뮤니티' },
  { id: 'diary', label: '다이어리' },
  { id: 'guestbook', label: '방명록' },
];

export function Navigation() {
  const { activeTab, setActiveTab } = useNavigation();

  return (
    <nav className="flex flex-wrap gap-0.5 sm:gap-1 items-end relative z-10 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
      {navItems.map((item) => {
        const isActive = item.id === activeTab;

        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`
              relative px-2.5 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base rounded-t-xl transition-all whitespace-nowrap cursor-pointer
              ${isActive
                ? 'bg-white dark:bg-surface-dark border-x border-t border-slate-200 dark:border-slate-700 text-primary font-bold shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                : 'bg-slate-200/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-x border-t border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }
            `}
          >
            {item.label}
            {item.badge && (
              <span className="absolute -top-1 -right-1">
                <Badge variant={item.badge.variant} size="sm" pulse={item.badge.pulse}>
                  {item.badge.text}
                </Badge>
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
