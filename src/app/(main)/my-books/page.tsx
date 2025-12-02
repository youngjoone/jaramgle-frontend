"use client";

import { useRouter } from 'next/navigation';
import { GalleryPage } from '@/components/GalleryPage';
import { useStorybooksStore } from '@/store';
import { useEffect, useState } from 'react';

export default function MyBooks() {
  const router = useRouter();
  const { storybooks, toggleShare, deleteStorybook, setViewingStorybook, loadMyStories } = useStorybooksStore();
  const ownedStorybooks = storybooks.filter(book => book.isOwned);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await loadMyStories();
      } catch (err: any) {
        console.error(err);
        if (mounted) setError("내 동화책을 불러오지 못했어요.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [loadMyStories]);

  const handleShare = async (id: number) => {
    try {
      await toggleShare(id);
    } catch (err) {
      alert("공유 설정에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 동화책을 삭제할까요?")) return;
    try {
      await deleteStorybook(id);
    } catch (err) {
      alert("삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-[#757575]">내 동화책을 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-500">
        {error}
      </div>
    );
  }

  return (
    <GalleryPage
      storybooks={ownedStorybooks}
      onToggleShare={handleShare}
      onDelete={handleDelete}
      onNavigateToCreate={() => router.push('/create')}
      onViewStorybook={setViewingStorybook}
    />
  );
}
