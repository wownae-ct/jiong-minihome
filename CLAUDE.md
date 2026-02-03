# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 방식

반드시 모든 개발은 테스트 주도 개발 방식을 사용하세요.

## Build Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Font**: Inter, Noto Sans KR (body), Gaegu (display/handwritten)

### Directory Structure

```
src/
├── app/           # Next.js App Router pages and layouts
│   ├── layout.tsx # Root layout with fonts and global styles
│   ├── page.tsx   # Homepage
│   └── globals.css
└── components/    # Reusable React components
```

## Design Reference

This is a Korean "미니홈피" (mini-homepage) style portfolio for an IT Infrastructure Engineer. Design reference files are in `stitch_it_engineer_mini_homepage_alternative/`.

### Design System

- **Primary color**: `#3b82f6` (blue-500)
- **Light background**: `#f1f5f9` (slate-100)
- **Dark background**: `#0f172a` (slate-900)
- **Dark mode**: Toggled via `class="dark"` on `<html>`
- **Icons**: Material Symbols Outlined (loaded via Google Fonts)

### Planned Sections

- Introduce (소개)
- Career (경력)
- Portfolio (포트폴리오)
- Community (커뮤니티)
- Diary (다이어리)
- Guestbook (방명록)
