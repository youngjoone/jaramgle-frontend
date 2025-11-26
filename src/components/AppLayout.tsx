"use client";

import { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { BottomNav } from '@/components/BottomNav';
import { StoryBookViewerPage } from '@/components/StoryBookViewerPage';
import { useStorybooksStore } from '@/store';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { viewingStorybook, setViewingStorybook } = useStorybooksStore();

  return (
    <div className="min-h-screen bg-white">
      {/* Left Sidebar - Hidden on mobile */}
      <Sidebar />

      {/* Main Content Area - Responsive margins */}
      <div className="md:ml-20 pb-20 md:pb-0">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* StoryBook Viewer Modal */}
      {viewingStorybook && (
        <StoryBookViewerPage
          storybook={viewingStorybook}
          onClose={() => setViewingStorybook(null)}
        />
      )}
    </div>
  );
}
