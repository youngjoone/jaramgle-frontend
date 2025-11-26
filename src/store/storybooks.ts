"use client";

import { create } from 'zustand';

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
}

const initialStorybooks: Storybook[] = [
  // Shared community storybooks
  {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1600804010026-8387cc05e1c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "작은 여우의 모험",
    author: "김지우",
    categories: ["판타지", "동물"],
    likes: 342,
    isBookmarked: false,
    isShared: true,
    isOwned: false
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1584446319794-0bf9637817c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "마법의 정원 공주님",
    author: "박소희",
    categories: ["판타지", "마법"],
    likes: 1284,
    isBookmarked: true,
    isShared: true,
    isOwned: false
  },
  {
    id: 3,
    imageUrl: "https://images.unsplash.com/photo-1760801656960-e5ca8e1934c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "용감한 작은 로봇",
    author: "이민준",
    categories: ["SF", "모험"],
    likes: 856,
    isBookmarked: false,
    isShared: true,
    isOwned: false
  },
  {
    id: 4,
    imageUrl: "https://images.unsplash.com/photo-1574244931790-ee19df716899?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "마법 숲의 비밀",
    author: "정서연",
    categories: ["판타지", "자연"],
    likes: 523,
    isBookmarked: false,
    isShared: true,
    isOwned: false
  },
  {
    id: 5,
    imageUrl: "https://images.unsplash.com/photo-1710846125494-10570e3502f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "숲속 친구들의 우정",
    author: "최하준",
    categories: ["동물", "우정"],
    likes: 2107,
    isBookmarked: true,
    isShared: true,
    isOwned: false
  },
  {
    id: 6,
    imageUrl: "https://images.unsplash.com/photo-1530053969600-caed2596d242?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "바다 속 탐험",
    author: "강민서",
    categories: ["바다", "모험"],
    likes: 945,
    isBookmarked: false,
    isShared: true,
    isOwned: false
  },
  {
    id: 7,
    imageUrl: "https://images.unsplash.com/photo-1727363584291-433dcd86a0fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "별을 향한 여행",
    author: "윤채원",
    categories: ["우주", "모험"],
    likes: 678,
    isBookmarked: false,
    isShared: true,
    isOwned: false
  },
  {
    id: 8,
    imageUrl: "https://images.unsplash.com/photo-1742960597696-837ffc8a64bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "잃어버린 왕국",
    author: "김도윤",
    categories: ["판타지", "왕국"],
    likes: 1456,
    isBookmarked: true,
    isShared: true,
    isOwned: false
  },
  {
    id: 9,
    imageUrl: "https://images.unsplash.com/photo-1610926597998-fc7f2c1b89b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "용의 비밀",
    author: "이서진",
    categories: ["판타지", "드래곤"],
    likes: 1823,
    isBookmarked: false,
    isShared: true,
    isOwned: false
  },
  {
    id: 10,
    imageUrl: "https://images.unsplash.com/photo-1739681118696-d7b3d05d5fa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "마법의 정원",
    author: "박지호",
    categories: ["마법", "자연"],
    likes: 2543,
    isBookmarked: true,
    isShared: true,
    isOwned: false
  },
  // My owned storybooks (some shared, some not)
  {
    id: 101,
    imageUrl: "https://images.unsplash.com/photo-1614112163164-e8749a2e7628?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "달님과 함께하는 꿈",
    author: "나",
    categories: ["자장가", "꿈"],
    likes: 127,
    isBookmarked: false,
    isShared: true,
    isOwned: true
  },
  {
    id: 102,
    imageUrl: "https://images.unsplash.com/photo-1737689677304-a2661ae592a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "북극곰의 겨울 여행",
    author: "나",
    categories: ["동물", "겨울"],
    likes: 0,
    isBookmarked: false,
    isShared: false,
    isOwned: true
  },
  {
    id: 103,
    imageUrl: "https://images.unsplash.com/photo-1558898478-9ac0461266c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "나비의 정원",
    author: "나",
    categories: ["자연", "마법"],
    likes: 89,
    isBookmarked: false,
    isShared: true,
    isOwned: true
  },
  {
    id: 104,
    imageUrl: "https://images.unsplash.com/photo-1648752305744-40ce4f181f70?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "달나라로 가는 로켓",
    author: "나",
    categories: ["우주", "모험"],
    likes: 0,
    isBookmarked: false,
    isShared: false,
    isOwned: true
  },
  {
    id: 105,
    imageUrl: "https://images.unsplash.com/photo-1558613468-da6379080163?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "공룡시대 탐험",
    author: "나",
    categories: ["공룡", "모험"],
    likes: 234,
    isBookmarked: false,
    isShared: true,
    isOwned: true
  },
  {
    id: 106,
    imageUrl: "https://images.unsplash.com/photo-1621450203249-5af080aa1bcc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "인어공주의 비밀 동굴",
    author: "나",
    categories: ["바다", "판타지"],
    likes: 0,
    isBookmarked: false,
    isShared: false,
    isOwned: true
  }
];

interface StorybooksState {
  storybooks: Storybook[];
  viewingStorybook: Storybook | null;
  toggleBookmark: (id: number) => void;
  toggleLike: (id: number) => void;
  toggleShare: (id: number) => void;
  deleteStorybook: (id: number) => void;
  setViewingStorybook: (storybook: Storybook | null) => void;
  getSharedStorybooks: () => Storybook[];
  getOwnedStorybooks: () => Storybook[];
}

export const useStorybooksStore = create<StorybooksState>((set, get) => ({
  storybooks: initialStorybooks,
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
  toggleShare: (id) => set((state) => ({
    storybooks: state.storybooks.map(book =>
      book.id === id ? { ...book, isShared: !book.isShared } : book
    )
  })),
  deleteStorybook: (id) => set((state) => ({
    storybooks: state.storybooks.filter(book => book.id !== id)
  })),
  setViewingStorybook: (storybook) => set({ viewingStorybook: storybook }),
  getSharedStorybooks: () => get().storybooks.filter(book => book.isShared),
  getOwnedStorybooks: () => get().storybooks.filter(book => book.isOwned),
}));
