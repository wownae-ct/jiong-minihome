'use client'

import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { MainLayout } from '@/components/layout/MainLayout';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { TabContent } from '@/components/content/TabContent';
import { TabProvider, useNavigation } from '@/components/providers/tab';

function HomeContent() {
  const { activeTab } = useNavigation();
  const showSidebarOnMobile = activeTab === 'intro';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <Header />
      <Navigation />
      <MainLayout sidebar={<Sidebar />} showSidebarOnMobile={showSidebarOnMobile}>
        <TabContent />
      </MainLayout>
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <TabProvider>
      <HomeContent />
    </TabProvider>
  );
}
