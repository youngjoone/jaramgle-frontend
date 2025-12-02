"use client";

import { ExplorePage } from '@/components/ExplorePage';
import { useStorybooksStore } from '@/store';
import { useEffect, useState } from 'react';

export default function Library() {
  const { storybooks, toggleBookmark, toggleLike, setViewingStorybook, loadSharedStories } = useStorybooksStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadSharedStories();
      } catch (err: any) {
        console.error(err);
        if (mounted) setError("공유된 동화책을 불러오지 못했어요.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [loadSharedStories]);

  return (
    <ExplorePage
      storybooks={storybooks}
      onToggleBookmark={toggleBookmark}
      onToggleLike={toggleLike}
      onViewStorybook={setViewingStorybook}
      isLoading={isLoading}
      error={error}
    />
  );
}
