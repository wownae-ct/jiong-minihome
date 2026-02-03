# Contribution Guide

## Development Environment Setup

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd portfolio-web

# Install dependencies
npm install
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server at http://localhost:3000 with hot reload |
| `build` | `next build` | Build optimized production bundle |
| `start` | `next start` | Start production server (requires `build` first) |
| `lint` | `next lint` | Run ESLint to check code quality |

### Usage Examples

```bash
# Development
npm run dev

# Production build and run
npm run build
npm run start

# Code quality check
npm run lint
```

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   Opens at http://localhost:3000 with Fast Refresh enabled.

2. **Make Changes**
   - Edit files in `src/` directory
   - Changes reflect immediately in browser

3. **Run Linter Before Commit**
   ```bash
   npm run lint
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Environment Variables

*No environment variables required at this time.*

When environment variables are added, they will be documented in `.env.example`.

## Project Structure

```
src/
├── app/           # Next.js App Router pages
│   ├── layout.tsx # Root layout
│   ├── page.tsx   # Homepage
│   └── globals.css
├── components/    # React components
│   ├── providers/ # Context providers
│   ├── layout/    # Layout components
│   ├── sidebar/   # Sidebar components
│   ├── content/   # Content section components
│   └── ui/        # Reusable UI components
└── types/         # TypeScript type definitions
```

## Code Style

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Linting**: ESLint with Next.js config

## Testing

*Testing setup pending. See RUNBOOK.md for planned testing procedures.*

---

*Auto-generated from package.json on 2026-01-30*
