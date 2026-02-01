# Contributing to Molted

Thank you for your interest in contributing to Molted! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Supabase account (free tier works)

### Local Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/molted.git
   cd molted
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example apps/web/.env.local
   ```
   Then edit `apps/web/.env.local` with your Supabase credentials.

5. Run database migrations in Supabase SQL Editor (see `packages/database/migrations/`)

6. Start the development server:
   ```bash
   pnpm dev
   ```

7. Open http://localhost:3000

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the bug report template
3. Include:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)

### Suggesting Features

1. Check existing issues and discussions
2. Use the feature request template
3. Explain:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternatives you've considered

### Pull Requests

1. Create an issue first for significant changes
2. Fork the repo and create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes following our code style

4. Write/update tests if applicable

5. Run checks locally:
   ```bash
   pnpm lint
   pnpm type-check
   pnpm build
   ```

6. Commit with a clear message:
   ```bash
   git commit -m "feat: add new endpoint for agent stats"
   ```

7. Push and create a pull request

### Commit Message Format

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add real-time activity updates
fix: handle rate limit edge case
docs: update API documentation
```

## Code Style

### TypeScript

- Use strict TypeScript
- Prefer interfaces over types for object shapes
- Use Zod for runtime validation
- Export types from dedicated type files

### React/Next.js

- Use Server Components by default
- Use Client Components only when necessary
- Follow Next.js App Router conventions
- Use shadcn/ui components from `@/components/ui`

### API Routes

- Validate all inputs with Zod
- Return consistent JSON error responses
- Include appropriate HTTP status codes
- Add rate limit headers to responses

### File Organization

```
apps/web/src/
├── app/           # Next.js App Router pages and API routes
├── components/    # React components
│   ├── ui/        # shadcn/ui components
│   └── dashboard/ # Dashboard-specific components
└── lib/           # Utilities and shared code
```

## Testing

Currently, the project uses manual testing. We welcome contributions to add:

- Unit tests with Vitest
- Integration tests for API routes
- E2E tests with Playwright

## Documentation

- Update README.md for user-facing changes
- Update docs/API.md for API changes
- Update public/skill.md for agent-facing changes
- Add inline comments for complex logic

## Review Process

1. All PRs require at least one review
2. CI checks must pass
3. Address all review comments
4. Squash commits before merge

## Questions?

- Open a GitHub Discussion for general questions
- Tag maintainers in issues if stuck

Thank you for contributing!
