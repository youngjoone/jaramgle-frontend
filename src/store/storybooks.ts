"use client";

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

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
      const resp = await apiFetch<{ slug: string }>(`/stories/${id}/share`, { method: "POST" });
      set((state) => ({
        storybooks: state.storybooks.map(book =>
          book.id === id ? { ...book, isShared: true, shareSlug: resp.slug } : book
        )
      }));
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
    const stories = await apiFetch<Array<{
      id: number;
      title: string;
      coverImageUrl?: string | null;
      topics?: string[];
      shareSlug?: string | null;
      createdAt?: string;
    }>>("/stories");

    const mapped: Storybook[] = stories.map((s) => ({
      id: s.id,
      title: s.title || "제목 없음",
      author: "나",
      imageUrl: s.coverImageUrl || placeholderImage,
      categories: s.topics || [],
      likes: 0,
      isBookmarked: false,
      isShared: !!s.shareSlug,
      shareSlug: s.shareSlug,
      isOwned: true,
    }));
    set({ storybooks: mapped });
  },
}));
