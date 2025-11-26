"use client";

import { ExplorePage } from '@/components/ExplorePage';
import { useStorybooksStore } from '@/store';

export default function Library() {
  const { storybooks, toggleBookmark, toggleLike, setViewingStorybook } = useStorybooksStore();
  const sharedStorybooks = storybooks.filter(book => book.isShared);

  return (
    <ExplorePage
      storybooks={sharedStorybooks}
      onToggleBookmark={toggleBookmark}
      onToggleLike={toggleLike}
      onViewStorybook={setViewingStorybook}
    />
  );
}
