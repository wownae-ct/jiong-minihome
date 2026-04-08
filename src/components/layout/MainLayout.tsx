import { ReactNode } from 'react';

interface MainLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  showSidebarOnMobile?: boolean;
}

export function MainLayout({ sidebar, children, showSidebarOnMobile = true }: MainLayoutProps) {
  return (
    <main className="bg-white dark:bg-surface-dark rounded-b-2xl rounded-tr-2xl border border-slate-200 dark:border-slate-700 shadow-xl min-h-[400px] md:min-h-[600px] overflow-hidden flex flex-col md:flex-row">
      {/* 사이드바 */}
      <aside className={`w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 p-4 sm:p-6 md:p-8 flex-col gap-6 bg-slate-50/50 dark:bg-slate-800/30 ${showSidebarOnMobile ? 'flex' : 'hidden md:flex'}`}>
        {sidebar}
      </aside>

      {/* 메인 콘텐츠 */}
      <section className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12">
        {children}
      </section>
    </main>
  );
}
