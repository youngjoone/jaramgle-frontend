# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev          # Start development server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint on .ts/.tsx files
pnpm type-check   # TypeScript type checking without emitting
pnpm validate     # Run lint, type-check, and build sequentially

# Database (Drizzle ORM with Neon)
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes directly
pnpm db:studio    # Open Drizzle Studio
```

## Tech Stack

- **Framework**: Next.js 16 with App Router (React 19)
- **Database**: Drizzle ORM with Neon (serverless PostgreSQL)
- **Auth**: Cookie-based OAuth via backend (Google, Kakao, Naver)
- **Styling**: Tailwind CSS v4 with tw-animate-css
- **State**: Zustand (persisted auth, in-memory storybooks)
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form with Zod validation (@hookform/resolvers)
- **Animations**: Framer Motion
- **UI Components**: Radix UI primitives with shadcn/ui patterns

## Architecture

### Route Groups
- `(auth)/` - Public routes (login page)
- `(main)/` - Protected routes wrapped with `AuthGuard` and `AppLayout`
- `/auth/callback` - OAuth callback handler

### Authentication Flow
- Backend handles OAuth at `BACKEND_ORIGIN/oauth2/authorization/{provider}`
- Frontend uses cookie-based sessions with automatic token refresh
- `AuthGuard` component bootstraps session and redirects unauthenticated users
- Guest mode allows limited access to `/library` page only

### State Management (Zustand)
- `useAuthStore` - Auth state with localStorage persistence
- `useStorybooksStore` - Storybook data and viewer modal state
- Import stores from `@/store` barrel export

### API Layer (`src/lib/api.ts`)
- `apiFetch()` - Wrapper with automatic 401 handling and token refresh
- `authApi` - Auth-specific endpoints (login, logout, profile, session bootstrap)
- `API_BASE` configured via `NEXT_PUBLIC_API_BASE` env var (default: `http://localhost:8080/api`)

### Layout Structure
- `AppLayout` wraps main content with responsive sidebar/bottom nav
- `Sidebar` - Desktop navigation (left side)
- `BottomNav` - Mobile navigation (bottom)
- `StoryBookViewerPage` - Modal overlay controlled via Zustand store

## Code Conventions

- Path alias: `@/*` maps to `./src/*`
- Use `cn()` from `@/lib/utils` for conditional className merging
- TypeScript strict mode is enabled
- UI components in `src/components/ui/` follow shadcn/ui patterns with CVA for variants

## Design System (MUST FOLLOW)

**이 프로젝트는 일관된 디자인 시스템을 가지고 있습니다. 새로운 컴포넌트나 스타일을 작성할 때 반드시 기존 시스템을 따라야 합니다.**

### 절대 규칙 (CRITICAL)

1. **하드코딩 금지**: 색상, 간격, 폰트 등에 raw 값을 절대 사용하지 마세요.
   ```tsx
   // ❌ 절대 하지 마세요
   className="text-[#66BB6A] p-[16px] text-[14px]"
   style={{ color: '#66BB6A', padding: '16px' }}

   // ✅ 올바른 방법
   className="text-primary p-md text-base"
   ```

2. **기존 UI 컴포넌트 재사용**: `src/components/ui/`에 있는 컴포넌트를 반드시 사용하세요.
   ```tsx
   // ❌ 버튼 직접 만들지 마세요
   <button className="bg-green-500 px-4 py-2 rounded">Click</button>

   // ✅ 기존 Button 컴포넌트 사용
   import { Button } from "@/components/ui/button"
   <Button variant="default">Click</Button>
   ```

3. **CSS 변수 활용**: `globals.css`에 정의된 디자인 토큰을 사용하세요.

### 색상 팔레트 (Color Tokens)

| 용도 | CSS Variable | Tailwind Class |
|------|--------------|----------------|
| 주요 액션/강조 | `--primary` (#66BB6A) | `bg-primary`, `text-primary` |
| 주요 어두운 톤 | `--primary-dark` (#388E3C) | - |
| 주요 밝은 톤 | `--primary-light` (#81C784) | - |
| 보조 액센트 | `--accent` (#B07BAC) | `bg-accent`, `text-accent` |
| 경고/삭제 | `--destructive` (#F44336) | `bg-destructive` |
| 배경 | `--background` | `bg-background` |
| 카드 배경 | `--card` | `bg-card` |
| 테두리 | `--border` (#E0E0E0) | `border-border` |
| 노란색 강조 | `--yellow` / `--yellow-light` | `bg-yellow`, `bg-yellow-light` |

### 텍스트 색상

| 용도 | CSS Variable | 사용 예시 |
|------|--------------|-----------|
| 메인 텍스트 | `--text-primary` (#1A1A1A) | 제목, 본문 |
| 보조 텍스트 | `--text-secondary` (#424242) | 부제목 |
| 3차 텍스트 | `--text-tertiary` (#757575) | 힌트 |
| 비활성 텍스트 | `--text-muted` (#9E9E9E) | placeholder |

### 간격 (Spacing Tokens)

| Token | 값 | Tailwind 예시 |
|-------|-----|---------------|
| `--spacing-xs` | 0.25rem (4px) | `p-1`, `gap-1` |
| `--spacing-sm` | 0.5rem (8px) | `p-2`, `gap-2` |
| `--spacing-md` | 1rem (16px) | `p-4`, `gap-4` |
| `--spacing-lg` | 1.5rem (24px) | `p-6`, `gap-6` |
| `--spacing-xl` | 2rem (32px) | `p-8`, `gap-8` |
| `--spacing-2xl` | 3rem (48px) | `p-12`, `gap-12` |
| `--spacing-section` | 2.5rem | 섹션 간 간격 |

### 타이포그래피

- **메인 폰트**: SUIT Variable (본문, UI)
- **로고 폰트**: Just Another Hand (로고 전용)
- **폰트 굵기**:
  - `--font-weight-bold` (700): 제목
  - `--font-weight-semibold` (600): 부제목, 버튼
  - `--font-weight-medium` (500): 라벨
  - `--font-weight-normal` (400): 본문

### 애니메이션

| Token | 값 | 용도 |
|-------|-----|------|
| `--duration-fast` | 150ms | 호버, 토글 |
| `--duration-normal` | 300ms | 일반 트랜지션 |
| `--duration-slow` | 500ms | 페이지 전환 |
| `--ease-out` | cubic-bezier(0.33, 1, 0.68, 1) | 자연스러운 감속 |
| `--ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | 부드러운 전환 |

### 그림자 (Shadows)

| Token | 용도 |
|-------|------|
| `--shadow-sm` | 작은 요소 (버튼, 카드) |
| `--shadow-md` | 중간 요소 (드롭다운, 팝오버) |
| `--shadow-lg` | 큰 요소 (모달, 다이얼로그) |
| `--shadow-primary` | 주요 CTA 버튼 강조 |

### 레이아웃

| Token | 값 | 용도 |
|-------|-----|------|
| `--sidebar-width` | 5rem | 데스크톱 사이드바 |
| `--topbar-height` | 4rem | 상단바 높이 |
| `--bottomnav-height` | 4rem | 모바일 하단 네비게이션 |
| `--radius` | 1.25rem (20px) | 기본 border-radius |

### UI 컴포넌트 사용법

```tsx
// Button - 반드시 variant와 size 사용
import { Button } from "@/components/ui/button"
<Button variant="default" size="lg">주요 액션</Button>
<Button variant="outline">보조 액션</Button>
<Button variant="ghost">텍스트 버튼</Button>
<Button variant="destructive">삭제</Button>

// Card - 구조화된 컴포넌트 사용
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>내용</CardContent>
</Card>

// Input, Dialog, Select 등 모두 @/components/ui/에서 import
```

### className 작성 규칙

```tsx
// cn() 유틸리티로 조건부 클래스 병합
import { cn } from "@/lib/utils"

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className // props로 받은 className은 항상 마지막
)} />
```

### 새 컴포넌트 작성 시 체크리스트

- [ ] 기존 UI 컴포넌트(`src/components/ui/`)로 해결 가능한지 먼저 확인
- [ ] 색상은 CSS 변수/Tailwind semantic 클래스 사용 (하드코딩 ❌)
- [ ] 간격은 spacing token 또는 Tailwind spacing 사용
- [ ] 폰트 굵기는 font-weight 변수 사용
- [ ] 애니메이션은 duration/ease 변수 사용
- [ ] 반응형은 모바일 우선으로 작성 (sm:, md:, lg:)
- [ ] `cn()` 유틸리티로 className 병합
