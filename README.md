# Echoboard: white-label feedback, roadmap and changelog

Collect feedback on boards, let customers vote without signing up, share a public roadmap and
tell every voter when their idea ships. Rebrand it and run it as your own feedback SaaS: each
customer company gets its own workspace.

Built on Next.js 16, React 19, TypeScript, Postgres (Drizzle ORM), Better Auth and Polar or
Stripe billing.

## What's inside

**Feedback**
- Boards per workspace (e.g. "Feature requests", "Bugs"): add, rename and delete
  (owners and admins)
- Public portal per workspace at `/p/<workspace>`: share ideas, vote and comment **without an
  account** (name and email optional), Top/New sorting, search, board filter, paging
- Public roadmap (Planned, In progress, Complete) with voting on the cards
- Team inbox: filter, search and sort all feedback; change status, board and wording; merge
  duplicates (no double votes); delete posts and comments (owners and admins)
- Statuses: open, under review, planned, in progress, complete, closed
- Changelog (drafts, publish, link shipped ideas) with a public page per entry
- **"It shipped" emails:** status changes and published changelog entries email everyone who
  voted and left an email, one email per person, with unsubscribe links
- Spam protection: rate limits per visitor for votes, ideas and comments

**Accounts**
- Email and password sign-up with email verification, log in, forgot/reset password
- Account page: change name and password, light/dark/system theme, delete account
- Returns you to the page you were on after logging in; opens your last-used organization

**Organizations (multi-tenant)**
- Every customer gets its own workspace at `/dashboard/<organization>`; data never mixes
- Roles: **owner**, **admin**, **member**, with permissions in one file (`src/lib/permissions.ts`)
- Invite teammates by email (7-day, single-use links), change roles, remove members
- Organization picker for people in several organizations, rename, leave and delete

**Billing**
- One paid plan ("Pro") with an optional free trial, billed per organization
- **Polar** or **Stripe**, switched with one environment variable
- Checkout (email pre-filled), customer portal (change card, cancel, invoices), webhooks
- Member limit on the Free plan, failed-payment warnings, no duplicate subscriptions

**Product basics**
- Landing page with pricing, Terms and Privacy templates, SEO (preview image, sitemap, robots.txt)
- Dashboard with sidebar, mobile menu, user menu, loading skeletons, error and 404 pages
- Transactional emails with Resend (printed in the terminal while developing)

**Quality**
- TypeScript (strict), Biome lint and format, unit tests, GitHub Actions CI
- Security headers, rate-limited login and emails, environment checked at startup
- Accessible forms and buttons, "Are you sure?" on destructive actions, no double submits

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Postgres (Neon) with
Drizzle ORM · Better Auth · Polar or Stripe · Resend · Biome

## Quick start

You need **Node.js 20.12 or newer** and a free **Neon** account (https://neon.tech).

```bash
npm install
cp .env.example .env        # then fill in .env (see below)
npm run db:migrate          # creates the tables
npm run db:seed             # optional: demo workspace "Acme Inc." with members and feedback
npm run dev                 # http://localhost:3000
```

Log in as a demo member (`owner@acme.test`, `admin@acme.test`, `maya@acme.test`, password
`echoboard-demo`, set in `src/db/seed.ts`) or sign up at http://localhost:3000/signup. Without a Resend key the verification email is printed
in the terminal; open the link from there.

## Environment variables

Everything lives in `.env` (copy `.env.example`). When the app starts it checks these and lists
anything missing or invalid, so you are never left guessing.

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string (Neon dashboard > Connect) |
| `BETTER_AUTH_SECRET` | yes | Random string, 32+ characters (see the command below) |
| `BETTER_AUTH_URL` | yes | Where the app runs, no trailing slash: `http://localhost:3000` or `https://yourapp.com` |
| `RESEND_API_KEY` | production | Resend API key. Without it emails are printed in the terminal |
| `EMAIL_FROM` | production | Sender, e.g. `YourApp <hello@yourapp.com>`, on a domain verified in Resend |
| `DEMO_MODE` | no | `true` for a public demo without emails (see below). Leave unset for a real app |
| `BILLING_PROVIDER` | yes | `polar` or `stripe` |
| `POLAR_*` / `STRIPE_*` | for your provider | See below |

Generate a `BETTER_AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Emails (Resend)

1. Create an account at https://resend.com and an API key.
2. For production, verify your domain in Resend and set `EMAIL_FROM` to an address on it.
   (`onboarding@resend.dev` only delivers to your own Resend email address.)

### Public demo without a domain (`DEMO_MODE`)

Want a live demo before you own a domain? Set `DEMO_MODE="true"` on the demo deployment:
sign-up skips email verification, no emails are sent (Resend isn't needed), invitations show
their link on screen to share by hand, a banner tells visitors, and the Billing page shows
the test card to pay with. Never turn it on for a real
app: anyone could sign up with an email address they don't own.

### Billing with Polar (default)

1. Create an organization at https://sandbox.polar.sh for testing (https://polar.sh for real money).
2. Create a product "Pro" with a **monthly** price. Add a free trial on the product if you want one.
3. Set `POLAR_SERVER` (`sandbox` or `production`), `POLAR_ACCESS_TOKEN` (Settings > Developers)
   and `POLAR_PRO_PRODUCT_ID`.
4. Add a webhook to `https://<your-domain>/api/webhooks/polar` (format Raw, API version
   `2026-10`) with all the `subscription.*` events, and copy its secret into `POLAR_WEBHOOK_SECRET`.
5. Settings > Subscriptions: turn on **Allow multiple subscriptions**. Polar's default allows one
   subscription per email, so someone who owns two organizations couldn't upgrade the second
   ("You already have an active subscription"). The app itself still blocks a second
   subscription for the same organization: each subscription stores its organization in
   metadata, so one person can pay for several organizations with one email.

### Billing with Stripe

1. In test mode, create a product "Pro" with a **recurring monthly** price and copy the price ID
   (`price_...`) into `STRIPE_PRO_PRICE_ID`, and your secret key into `STRIPE_SECRET_KEY`.
2. Turn on the customer portal once: Settings > Billing > Customer portal > Save.
3. Add a webhook to `https://<your-domain>/api/webhooks/stripe` with the
   `customer.subscription.*` and `checkout.session.completed` events; copy the signing secret
   into `STRIPE_WEBHOOK_SECRET`.
4. Optional: `STRIPE_TRIAL_DAYS` for a free trial.

To receive webhooks on your computer, use the Stripe CLI (`stripe listen`) or a tunnel such as
ngrok for Polar.

> The Stripe integration is type-checked and its webhook signature check is tested, but it has
> not been run against a live Stripe account. Polar has been tested end to end in its sandbox.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run check` | Typecheck, lint, tests and a production build. Run before every commit |
| `npm test` | Unit tests only |
| `npm run lint` / `npm run format` | Check / fix formatting and lint rules |
| `npm run db:generate` | Create a migration after you change `src/db/schema/` |
| `npm run db:migrate` | Apply migrations to the database in `DATABASE_URL` |
| `npm run db:studio` | Browse your data in Drizzle Studio |
| `npm run db:seed` | Add demo data (safe to run again) |

## Make it yours

- **Name, tagline, company, support email:** `src/config/site.ts`
- **Logo:** `src/components/logo.tsx` (swap the text for an image)
- **Colors and dark mode:** the color tokens in `src/app/globals.css`
- **Plans, prices and features shown:** `src/lib/billing/plans.ts` (the real price is set in
  Polar or Stripe; keep them in sync)
- **Roles and permissions:** `src/lib/permissions.ts`
- **Landing page:** `src/app/page.tsx`
- **Terms and Privacy:** `src/app/terms` and `src/app/privacy` are templates, not legal advice.
  Have them reviewed before launch.

### Add your own feature

Follow the **Boards** feature (`src/app/dashboard/[slug]/boards` and `src/db/schema/feedback.ts`).
It shows the three rules every feature should follow:

1. Check the user's role first: `requirePermission(slug, "board:manage")`.
2. Validate input on the server (`checkBoardInput` in `src/lib/board.ts`).
3. Save and filter every row by `organizationId`, so organizations never see each other's data.

Then run `npm run db:generate` and `npm run db:migrate`, and add a link in
`src/components/dashboard-nav.tsx`.

## Project structure

```
src/
  app/            pages and API routes (Next.js App Router)
    dashboard/[slug]/   everything inside an organization
    api/webhooks/       Polar and Stripe webhooks
  components/     shared components; ui/ has Button, Input, SubmitButton, Skeleton
  config/site.ts  name and branding
  db/             schema/ (one file per area), connection and seed script
  lib/            auth, sessions, permissions, billing, emails, helpers (+ tests)
  proxy.ts        sends logged-out visitors to log in, remembers the last organization
drizzle/          database migrations
```

## Deploying (Vercel + Neon)

1. Push the code to a private GitHub repository and import it in Vercel.
2. In Neon, create a production branch/database and run `npm run db:migrate` against it.
3. In Vercel, add the environment variables (a **new** `BETTER_AUTH_SECRET`, and
   `BETTER_AUTH_URL` set to your real domain).
4. Point your provider's webhook at `https://<your-domain>/api/webhooks/<polar|stripe>`.
5. Pick a Vercel region close to your Neon database; every page talks to it.
6. Sign up on the live site and test the whole flow once, including an upgrade.

## Good to know

- `npm audit` reports 0 vulnerabilities. `package.json` pins a newer `esbuild` for `drizzle-kit`
  through `overrides`; re-check `npm audit` after installing new packages.
- In development the database is far away compared to production, so pages feel slower locally.
- AI coding tools: `AGENTS.md` explains the project's rules to Cursor, Claude Code and others.

## Support

Questions, bugs or setup help: email **qaweem321@gmail.com**. Please include your order email
and, for bugs, the steps to reproduce and any error message. Updates (fixes and new versions)
are listed in [CHANGELOG.md](CHANGELOG.md).

## License

Commercial license; see [LICENSE](LICENSE). You may build and sell your own products with it,
the exact terms for reselling Echoboard as a hosted service are in the license.
