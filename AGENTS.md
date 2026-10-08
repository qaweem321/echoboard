# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, Codex, ...) working on this project.
Humans: start with README.md.

## The project

Echoboard: a white-label feedback, roadmap and changelog app that buyers rebrand and run as
their own SaaS. Next.js 16 App Router, React 19, TypeScript (strict), Tailwind 4, Drizzle ORM on
Postgres (Neon), Better Auth, Polar or Stripe billing, Resend emails, Biome. Built on the
StarterKit foundation. `PLAN.md` lists the build phases and key decisions.

Two kinds of people use it:
- **Team members** (Better Auth users with a membership) manage a workspace in `/dashboard`.
- **Voters** (`voters` table) use a workspace's public portal. They have no login: a random
  browser cookie identifies them (only its hash is stored), with an optional name and email.

## Next.js 16 is newer than your training data

Read the docs that ship with the package before using a Next.js API:
`node_modules/next/dist/docs/`. For example: `middleware` is now `proxy` (`src/proxy.ts`),
`next lint` is gone (we use Biome), `params` and `headers()` are async.

## Commands

- `npm run check`: typecheck + lint + tests + production build. **Must pass before every commit.**
- `npm run format`: fix formatting and import order (Biome).
- `npm test`: unit tests (`node:test` via tsx, files named `*.test.ts` next to the code).
- After changing `src/db/schema/`: `npm run db:generate`, then `npm run db:migrate`.

## Where things live

- `src/app/dashboard/[slug]/`: everything inside an organization. `src/app/dashboard/page.tsx`
  picks which organization to open.
- `src/db/schema/`: tables, one file per area (`auth`, `organizations`, `billing`, `feedback`).
  `posts.vote_count` and `comment_count` are stored counts: update them in the same
  `db.batch` as the vote or comment they count.
- `src/app/p/[org]/`: the public portal (no login). Data loading lives in `src/lib/portal/`
  (`getPortal`, `listPortalPosts`, `getPortalPost`, `getTeamViewer`); portal actions get the
  voter with `getOrCreateVoter()` and check every ID against the workspace (`findPost`).
  Portal actions are public, so each one has a `rateLimit` by IP.
- `src/app/dashboard/[slug]/feedback/`: the team's inbox and post page. Queries in
  `src/lib/feedback/` (`inbox.ts`, `merge.ts`, `counts.ts` for the recount expressions,
  `filters.ts` for search shared with the portal). After changing feedback, call
  `refreshPortal(slug)` so the portal and roadmap update.
- List pages keep their options in the URL: parse with `src/lib/url-params.ts` helpers
  (see `portal-params.ts`, `inbox-params.ts`) and page with `<Pager>`.
- `src/lib/session.ts`: `requireUser`, `requireMembership(slug)`, `requirePermission(slug, perm)`.
- `src/lib/permissions.ts`: the only place roles and permissions are defined (`can(role, perm)`).
- `src/lib/billing/`: provider interface (`types.ts`), Polar and Stripe, plans and statuses.
  Billing is per organization: Polar subscriptions carry `organizationId` in metadata (Polar has
  one customer per email); Stripe has one customer per organization.
- `src/lib/env.ts`: environment checks at startup (`src/instrumentation.ts`).
- `src/lib/demo.ts`: `isDemoMode()` (`DEMO_MODE="true"`): no emails, no verification, banner.
  Anything new that sends email needs a demo-mode path (see invitations).
- `src/proxy.ts`: logged-out redirect with `?next=`, last-used organization cookie.
- `src/config/site.ts`: name, branding, `absoluteUrl()`.
- `src/components/ui/`: `Button`/`ButtonLink` (variants), `Input`/`Select`, `SubmitButton`,
  `Skeleton`. Shared pieces: `PlanCard`, `Logo`, `UserMenu`, `PaymentProblemNotice`.

## Rules

**Security and data**
- Every server action and page starts with `requireMembership` or `requirePermission`. Never
  trust IDs or roles sent by the browser.
- Every query on organization data filters by `organizationId` (see
  `src/app/dashboard/[slug]/boards/actions.ts`, the reference feature).
- Validate and trim all input on the server. Compare emails in lowercase and check them with
  `isValidEmail()` (`src/lib/email-address.ts`). Avoid regexes that can backtrack heavily.
- Redirects to user-supplied paths go through `safeNextPath()`.
- Anything that sends email or can be repeated cheaply gets a limit: `rateLimit(key, max,
  windowSeconds)` from `src/lib/rate-limit.ts`.
- New environment variables: add them to `.env.example` and to `checkEnv()` in `src/lib/env.ts`.

**Speed**
- The database is a network call away. Run independent queries with `Promise.all`, never query
  inside a loop (group or join instead), and avoid extra round trips. Use a cookie check
  (`getSessionCookie`) instead of a database session lookup where that's enough.

**UI**
- Use the semantic color tokens (`bg-background`, `text-muted-foreground`, `border-border`,
  `text-danger`, ...) so dark mode works. Don't use raw `gray-*` colors.
- Reuse `src/components/ui` instead of styling new buttons and inputs.
- Submit buttons: `SubmitButton` (disabled while sending), with `confirm` for destructive actions.
- Form actions return user mistakes as state for `useActionState` (`{ error }`), shown next to
  the form. Only `throw` for things the UI never allows (tampered requests).
- Dates: `formatDate()` from `src/lib/format.ts`. A sentence ending in a name someone typed:
  `endSentence(name)` (no "Acme Inc..").
- Give icon-only buttons an `aria-label`, mark decorative SVGs `aria-hidden="true"`.
- After logging in or out, use a full page load (`window.location.replace`), not the router.

**Code style**
- Small, single-purpose files. Shared logic goes in `src/lib`, shared UI in `src/components`.
- Short comments that explain *why*, in plain English.
- Add or update unit tests for logic in `src/lib`.

## Keep the docs in sync (every change)

In the **same commit** as a code change, update whatever it affects:
- `CHANGELOG.md`: add a line under `## [Unreleased]` for anything a buyer would notice.
- `README.md`: features list, setup steps, environment variables, scripts.
- `AGENTS.md`: new conventions, folders or rules.
- `.env.example`: new or changed variables.
- `src/app/privacy/page.tsx`: if the app starts storing new personal data.
