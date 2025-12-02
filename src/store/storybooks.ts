"use client";

import { create } from 'zustand';
import { apiFetch, BACKEND_ORIGIN } from '@/lib/api';

export interface Storybook {
  id: number;
  imageUrl: string;
  title: string;
  author: string;
  categories: string[];
  likes: number;
  isBookmarked: boolean;
  isShared: boolean;
  isOwned: boolean;
  shareSlug?: string | null;
}

const placeholderImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80";

interface StorybooksState {
  storybooks: Storybook[];
  viewingStorybook: Storybook | null;
  toggleBookmark: (id: number) => void;
  toggleLike: (id: number) => void;
  toggleShare: (id: number) => Promise<void>;
  deleteStorybook: (id: number) => Promise<void>;
  setViewingStorybook: (storybook: Storybook | null) => void;
  getSharedStorybooks: () => Storybook[];
  getOwnedStorybooks: () => Storybook[];
  setStorybooks: (items: Storybook[]) => void;
  loadMyStories: () => Promise<void>;
  loadSharedStories: () => Promise<void>;
}

export const useStorybooksStore = create<StorybooksState>((set, get) => ({
  storybooks: [],
  viewingStorybook: null,
  toggleBookmark: (id) => set((state) => ({
    storybooks: state.storybooks.map(book =>
      book.id === id ? { ...book, isBookmarked: !book.isBookmarked } : book
    )
  })),
  toggleLike: (id) => set((state) => ({
    storybooks: state.storybooks.map(book =>
      book.id === id ? { ...book, likes: book.likes + 1 } : book
    )
  })),
  toggleShare: async (id) => {
    try {
      if (!id || id <= 0) return; // 공유 피드 전용 카드(id 없음)는 무시
      const currentBook = get().storybooks.find(book => book.id === id);
      if (!currentBook) return;

      if (currentBook.isShared) {
        // Unshare
        await apiFetch(`/stories/${id}/share`, { method: "DELETE" });
        set((state) => ({
          storybooks: state.storybooks.map(book =>
            book.id === id ? { ...book, isShared: false, shareSlug: null } : book
          )
        }));
      } else {
        // Share
        const resp = await apiFetch<{ slug: string }>(`/stories/${id}/share`, { method: "POST" });
        set((state) => ({
          storybooks: state.storybooks.map(book =>
            book.id === id ? { ...book, isShared: true, shareSlug: resp.slug } : book
          )
        }));
      }
      // 서버 상태 동기화
      await get().loadMyStories();
    } catch (err) {
      console.error("공유 설정 실패", err);
      throw err;
    }
  },
  deleteStorybook: async (id) => {
    await apiFetch(`/stories/${id}`, { method: "DELETE" });
    set((state) => ({
      storybooks: state.storybooks.filter(book => book.id !== id)
    }));
  },
  setViewingStorybook: (storybook) => set({ viewingStorybook: storybook }),
  getSharedStorybooks: () => get().storybooks.filter(book => book.isShared),
  getOwnedStorybooks: () => get().storybooks.filter(book => book.isOwned),
  setStorybooks: (items) => set({ storybooks: items }),
  loadMyStories: async () => {
    const normalizeImage = (url?: string | null) => {
      if (!url) return placeholderImage;
      if (/^https?:\/\//i.test(url)) return url;
      return `${BACKEND_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
    };

    const stories = await apiFetch<Array<{
      id: number;
      title: string;
      coverImageUrl?: string | null;
      cover_image_url?: string | null;
      topics?: string[];
      shareSlug?: string | null;
      share_slug?: string | null;
      createdAt?: string;
    }>>("/stories");

    const mapped: Storybook[] = stories.map((s) => ({
      id: s.id,
      title: s.title || "제목 없음",
      author: "나",
      imageUrl: normalizeImage(s.coverImageUrl || (s as any).cover_image_url),
      categories: s.topics || [],
      likes: 0,
      isBookmarked: false,
      isShared: !!(s.shareSlug || (s as any).share_slug),
      shareSlug: s.shareSlug || (s as any).share_slug,
      isOwned: true,
    }));
    set({ storybooks: mapped });
  },
  loadSharedStories: async () => {
    const normalizeImage = (url?: string | null) => {
      if (!url) return placeholderImage;
      if (/^https?:\/\//i.test(url)) return url;
      return `${BACKEND_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
    };

    const sharedStories = await apiFetch<Array<{
      share_slug: string;
      title: string;
      shared_at: string;
      preview: string;
      like_count: number;
      comment_count: number;
      cover_image_url?: string | null;
    }>>("/public/shared-stories");

    const mapped: Storybook[] = sharedStories.map((s) => ({
      id: 0, // We don't have story ID in SharedStorySummaryDto, use shareSlug as identifier
      title: s.title || "제목 없음",
      author: "공유된 동화",
      imageUrl: normalizeImage(s.cover_image_url),
      categories: [],
      likes: Number(s.like_count) || 0,
      isBookmarked: false,
      isShared: true,
      shareSlug: s.share_slug,
      isOwned: false,
    }));
    set({ storybooks: mapped });
  },
}));
