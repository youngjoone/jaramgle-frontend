"use client";

import { useRouter } from 'next/navigation';
import { GalleryPage } from '@/components/GalleryPage';
import { useStorybooksStore } from '@/store';

export default function MyBooks() {
  const router = useRouter();
  const { storybooks, toggleShare, deleteStorybook, setViewingStorybook } = useStorybooksStore();
  const ownedStorybooks = storybooks.filter(book => book.isOwned);

  return (
    <GalleryPage
      storybooks={ownedStorybooks}
      onToggleShare={toggleShare}
      onDelete={deleteStorybook}
      onNavigateToCreate={() => router.push('/create')}
      onViewStorybook={setViewingStorybook}
    />
  );
}
