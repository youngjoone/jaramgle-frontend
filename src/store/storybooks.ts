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
  likedByMe?: boolean;
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
  toggleLike: (params: { id?: number; shareSlug?: string | null }) => Promise<void>;
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
  toggleLike: async ({ id, shareSlug }) => {
    // 좋아요는 공유된 동화(slug 기준)에서만 지원
    const slug = shareSlug || get().storybooks.find((b) => b.id === id)?.shareSlug;
    if (!slug) return;

    const toSafeLikes = (val: unknown) => {
      const num = Number(val);
      return Number.isFinite(num) ? num : 0;
    };
    // 낙관적 업데이트
    set((state) => ({
      storybooks: state.storybooks.map((book) => {
        if (book.shareSlug !== slug) return book;
        const nextLiked = !book.likedByMe;
        const baseLikes = toSafeLikes(book.likes);
        const nextCount = Math.max(0, baseLikes + (nextLiked ? 1 : -1));
        return { ...book, likedByMe: nextLiked, likes: nextCount };
      })
    }));

    try {
      const resp = await apiFetch<{ likeCount: number; liked: boolean }>(`/public/shared-stories/${slug}/likes`, {
        method: "POST",
      });
      const safeResp = toSafeLikes(resp.likeCount);
      set((state) => ({
        storybooks: state.storybooks.map((book) =>
          book.shareSlug === slug
            ? {
                ...book,
                likedByMe: resp.liked,
                // 서버가 0을 돌려도 증가 상태를 덮어쓰지 않도록 방향에 맞춰 보정
                likes: resp.liked
                  ? Math.max(toSafeLikes(book.likes), safeResp)
                  : Math.min(toSafeLikes(book.likes), safeResp),
              }
            : book
        )
      }));
    } catch (err) {
      console.error("좋아요 토글 실패", err);
      // 실패해도 UI는 낙관적 상태 유지, 콘솔에만 남김
      throw err;
    }
  },
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
      likedByMe: false,
      isBookmarked: false,
      isShared: !!(s.shareSlug || (s as any).share_slug),
      shareSlug: s.shareSlug || (s as any).share_slug,
      isOwned: true,
    }));

    // 공유된 내 동화는 공개 피드 요약과 동기화해 좋아요/내 좋아요 여부 반영
    const sharedSummaries = await apiFetch<Array<{
      shareSlug: string;
      share_slug?: string;
      likeCount: number;
      like_count?: number;
      likedByCurrentUser?: boolean;
      liked_by_current_user?: boolean;
    }>>("/public/shared-stories");

    if (sharedSummaries && sharedSummaries.length > 0) {
      const metaMap = new Map<string, { likes: number; likedByMe: boolean }>();
      sharedSummaries.forEach((s) => {
        const slug = s.shareSlug || (s as any).share_slug;
        if (!slug) return;
        const likes = Number(s.likeCount ?? (s as any).like_count) || 0;
        const liked = !!(s.likedByCurrentUser ?? (s as any).liked_by_current_user);
        metaMap.set(slug, { likes, likedByMe: liked });
      });
      mapped.forEach((m) => {
        if (m.shareSlug && metaMap.has(m.shareSlug)) {
          const meta = metaMap.get(m.shareSlug)!;
          m.likes = meta.likes;
          m.likedByMe = meta.likedByMe;
        }
      });
    }

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
      liked_by_current_user?: boolean;
      likedByCurrentUser?: boolean;
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
      likedByMe: !!(s.liked_by_current_user ?? s.likedByCurrentUser),
      isBookmarked: false,
      isShared: true,
      shareSlug: s.share_slug,
      isOwned: false,
    }));
    set({ storybooks: mapped });
  },
}));
