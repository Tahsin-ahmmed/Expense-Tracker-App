# Expense Tracker — Project Instructions

## 1. Project Overview

- **Project name:** Expense Tracker (mobile app brand: HisabBondhu)
- **Product type:** Personal expense and budget management system
- **Target market:** Bangladesh
- **Primary currency:** Bangladeshi Taka (BDT / ৳)

**Primary goal:** Build a modern, secure, reliable personal finance application that helps people manage daily income, expenses, budgets, and financial activities.

The product consists of:

1. Mobile application
2. Web admin panel
3. Shared backend and database

## 2. Technology Stack

### Mobile Application
- React Native
- Expo
- Expo Router
- TypeScript
- Zustand
- React Hook Form
- Zod

### Web Admin Panel
- Next.js
- TypeScript
- Tailwind CSS

### Backend
- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Row Level Security (RLS)

### Testing
- Jest
- React Native Testing Library
- Playwright
- Maestro (mobile UI automation)

## 3. Development Principles

- Use TypeScript strict mode.
- Follow clean and maintainable architecture.
- Write reusable components.
- Separate UI, business logic, and data access.
- Avoid unnecessary dependencies.
- Avoid duplicate code.
- Use meaningful variable and function names.
- Handle loading, error, empty, and success states.
- Write tests for important business logic.
- Follow accessibility best practices.
- Never introduce breaking changes without explanation.

## 4. Financial Data Rules

- Currency: BDT.
- Store monetary values as integer minor units (poisha).
- Never use floating-point arithmetic for financial calculations.
- Every user's financial records must be isolated.
- Use database-level RLS policies.
- Validate all financial input.
- Store transaction timestamps consistently.
- Use proper timezone handling for Bangladesh (Asia/Dhaka).
- Never expose service-role keys in client applications.

## 5. Mobile Application Features

- User registration and login.
- Dashboard.
- Income management.
- Expense management.
- Transaction history.
- Categories.
- Monthly budgets.
- Financial reports.
- Recurring transactions.
- Profile and settings.
- Bangla and English language support.

## 6. Web Admin Features

- Secure admin authentication.
- Admin dashboard.
- User management.
- Category management.
- Application statistics.
- System configuration.
- Audit logging.

Admin functionality must be protected by server-side authorization. Never rely only on hiding UI elements.

## 7. UI/UX Guidelines

- Modern fintech design.
- Clean and minimal interface.
- Mobile-first experience.
- Consistent spacing and typography.
- Accessible contrast.
- Responsive layouts.
- Light theme initially.
- Professional dashboard and charts.

## 8. Security Requirements

- Never commit secrets or credentials.
- Use environment variables.
- Validate inputs on the server.
- Implement RLS policies.
- Restrict access by user ownership.
- Protect administrative operations.
- Avoid logging sensitive financial information.

## 9. Git Guidelines

Use meaningful commit messages. Examples:

- `feat: implement dashboard UI`
- `feat: add expense creation`
- `fix: correct transaction validation`
- `test: add budget calculation tests`
- `refactor: improve transaction service`

Do not modify Git history or push changes without approval.

## 10. Claude Code Working Rules

Before implementing any feature:

1. Inspect the existing project.
2. Understand existing architecture.
3. Explain the proposed implementation.
4. Identify files that need modification.
5. Wait for approval for major architectural changes.

During implementation:

1. Work in small increments.
2. Do not unnecessarily rewrite existing files.
3. Maintain existing functionality.
4. Run relevant tests.
5. Fix errors introduced by your changes.

After implementation, report:

- What was implemented.
- Files created or modified.
- Dependencies added.
- Commands executed.
- Tests performed.
- Known issues.

**IMPORTANT:** Do not attempt to build the entire application in one step. Build incrementally and prioritize correctness, security, maintainability, and user experience.

## 11. Milestones

Work proceeds one milestone at a time, in order. Do not start a milestone's features before the previous milestone is approved.

| Milestone | Deliverable |
|---|---|
| M1 | Project foundation and navigation |
| M2 | Dashboard UI |
| M3 | Add income and expense |
| M4 | Transaction management |
| M5 | Budget management |
| M6 | Supabase integration |
| M7 | Reports and analytics |
| M8 | Web admin panel |
| M9 | Testing and deployment |

**Current milestone:** M1–M4 done. M5 implemented, awaiting review. Next: M6.

## 12. Repository Notes

- Single Git repository at the project root (remote: `origin` → GitHub `Tahsin-ahmmed/Expense-Tracker-App`, branch `main`). Planned layout: `mobile/` (Expo app), `admin/` (Next.js, M8), `supabase/` (migrations and RLS policies, M6).
- `mobile/` — Expo app, **Expo SDK 58** (React Native 0.88). Routes live in `mobile/src/app/`; the `@/*` import alias maps to `mobile/src/*`.
- Expo Go on the test device (Android, Play Store) runs SDK 58. Prefer packages bundled in Expo Go; flag any dependency that would require a development build.
- Install packages with `npx expo install <package>` (not `npm install`) so versions match the SDK.
- Before declaring work done in `mobile/`, run `npm run check` (typecheck, lint, Prettier check, Jest).
- Mobile source layout (`mobile/src/`): `app/` routes only (thin screens) · `components/ui/` reusable UI · `features/<name>/` feature code (components, hooks, services, types) · `domain/` plain-TS business rules (e.g. `money.ts`) · `data/` repositories (local now, Supabase in M6) · `theme/` tokens · `i18n/` strings via `t()`.
- Never hardcode user-facing strings, colours or spacing: use `t()`, `colors`, `spacing`/`radius`, and `AppText` variants.
- Money: `Poisha` type in `src/domain/money.ts`; use `parseTakaInput` and `formatTaka` (lakh/crore grouping).
- Dates: transactions store `occurredOn` as an `IsoDate` calendar day in Dhaka (`src/domain/date.ts`, fixed UTC+6) plus a UTC `createdAt`. Get "today" in components via `useToday()`.
- Local data: `expo-sqlite` behind `TransactionRepository` (`src/data/`). Schema changes = append a migration in `src/data/database.ts`; never edit a shipped one.
- State: Zustand store per feature (`createXStore(repository)` factory + app instance). Forms: React Hook Form + Zod schema in the feature's `schema.ts`.
- Native modules without a JS implementation are mocked in `mobile/jest.setup.ts`.
- Budgets are stored as history (`scope`, `effective_from` month, nullable limit): the limit for a month is the latest entry not after it. Edits apply from the current month onward; never rewrite past months.
- `t(key, params)` supports `{name}` placeholders. Use whole-sentence templates, never concatenated fragments, so Bangla can reorder words.
- Test files go in `__tests__/` folders, never inside `src/app/` (every file there becomes a route).
- Expo-specific agent rules: @mobile/AGENTS.md
