# Jaramgle Frontend (Next.js)

Jaramgle 웹 프론트엔드입니다.  
동화 생성, 커리큘럼 생성/주차 관리, 라이브러리, 관리자 페이지를 제공합니다.

## 기술 스택

- Next.js 16 (App Router)
- React 19, TypeScript
- Zustand (상태 관리)
- Tailwind CSS + shadcn/ui

## 실행

```bash
cd /Users/kyj/jaramgle/jaramgle-frontend
npm install
npm run dev
```

- 기본 주소: `http://localhost:3000`

## 환경 변수

- `NEXT_PUBLIC_API_BASE` (기본값: `http://localhost:8080/api`)

예시:

```bash
NEXT_PUBLIC_API_BASE=http://localhost:8080/api
```

## 주요 화면

- `/create`: 단일 동화 생성
- `/curriculums`: 커리큘럼 목록
- `/curriculums/new`: 커리큘럼 생성
- `/curriculums/[id]`: 커리큘럼 상세/주차 생성
- `/library`, `/my-books`: 내 동화 목록
- `/admin`: 관리자 대시보드

## 관리자 페이지 추가 기능

`/admin` > 스토리 탭에서:

- 고아 커리큘럼 스토리 점검
- 고아 커리큘럼 스토리 정리 실행

## 스크립트

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
```

## 연동

- 백엔드 API: `../jaramgle-backend/backend`
- AI 서버는 백엔드가 프록시/호출 처리

