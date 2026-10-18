# Echoboard: white-label feedback, roadmap and changelog

Launch your own feedback SaaS. Echoboard lets companies collect feature requests on public
boards, let their customers vote **without signing up**, share a roadmap, announce what shipped
and automatically email everyone who asked for it.

Every customer company gets its own **workspace** with its own team, portal, branding and
domain. You rebrand Echoboard, set your prices, and sell it under your own name, or run it for
your own company.

## Two ways to use it

| | Run it as your own feedback SaaS | Use it for your own company |
| --- | --- | --- |
| Who signs up | Other companies, who pay you monthly (Free and Pro plans) | Your team (and your clients' teams) |
| Billing | Polar or Stripe (`BILLING_PROVIDER="polar"` or `"stripe"`) | Turned off (`BILLING_PROVIDER="none"`): every workspace gets every feature, no pricing shown |

In both cases the people who vote and comment on a portal never pay and never need an account.
See "Billing" below for the setup of each.

## What's inside

**For your customers' users (no account needed)**
- Public portal per workspace (`/p/<workspace>`, or their own domain): share ideas, **vote and
  comment without an account** (name and email optional), Top/New sorting, search, boards
- **"Similar ideas already shared"** hints while typing, so people vote instead of duplicating
- Public **roadmap** (Planned, In progress, Complete) with voting on the cards
- Public **changelog** with a page per announcement
- **Embeddable widget:** one `<script>` tag adds a Feedback button and panel to any website;
  works where third-party cookies are blocked (Safari, Firefox)
- **"It shipped" emails:** voters who left an email hear when their idea changes status or ships,
  one email per person, with one-click unsubscribe

**For your customers' teams (the dashboard)**
- Boards (e.g. "Feature requests", "Bugs")
- Feedback inbox: filter, search, sort; change status, board and wording; **merge duplicates**
  (votes move over, nobody counted twice); delete posts and comments
- Changelog editor: drafts, publish, link the ideas an entry ships (marks them Complete and
  emails their voters)
- **White-label:** brand color, logo, hide "Powered by", **custom domain**
  (feedback.theircompany.com) with a DNS check
- **Webhooks** to Slack, Discord, Zapier, Make or any URL (Standard Webhooks signatures)
- Widget page with the code to copy
- Team members with owner, admin and member roles, email invitations

**For you, running the service**
- **Plans and billing** for your customers: Free and Pro, limits in one file (boards, team size,
  custom domain, branding, webhooks), enforced on the server; **Polar** or **Stripe**, or
  billing turned off
- Landing page with pricing, Terms and Privacy templates, SEO basics
- **Runs anywhere:** Vercel + Neon, or **Docker** with any Postgres (Caddy example included for
  automatic HTTPS on every customer domain)
- **Public demo mode** with a sample workspace and a reset script
- Security: rate limits on everything public, signed unsubscribe links, private-network
  blocking for webhooks, framing allowed only for the widget, security headers, input checks
- Quality: TypeScript strict, 100+ unit tests, Biome, GitHub Actions CI, `AGENTS.md` so AI
  coding tools follow the project's conventions

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Postgres with Drizzle ORM
(Neon or any Postgres) · Better Auth · Polar or Stripe · Resend · Biome

## Quick start (on your computer)

You need **Node.js 20.12 or newer** and a Postgres database. The easiest is a free
[Neon](https://neon.tech) database; any Postgres 15+ works.

```bash
npm install
cp .env.example .env        # then fill in .env (see "Environment variables")
npm run db:migrate          # creates the tables
npm run db:seed             # optional: sample workspace "Acme Inc." with feedback
npm run dev                 # http://localhost:3000
```

Then open:
- **http://localhost:3000/p/acme**: the sample workspace's public portal
- **http://localhost:3000/login**: log in as `owner@acme.test` with password `echoboard-demo`
  (also `admin@acme.test`, `maya@acme.test`), or sign up. Without Resend, the verification
  email is printed in the terminal; open the link from there.

## How it fits together

| Who | Where | What |
| --- | --- | --- |
| You (running the service) | `/` | Your landing page and pricing |
| A customer's team | `/dashboard/<workspace>` | Boards, inbox, changelog, branding, widget, webhooks, billing |
| Their users | `/p/<workspace>` or their own domain | Portal: ideas, votes, comments, roadmap, changelog |
| Their users, inside their app | `widget.js` → `/embed/<workspace>` | The same, in a panel |

Visitors are not accounts: a random code in their browser (a cookie on the portal, the panel's
own storage in the widget) remembers their votes. Only its hash is stored.

## Environment variables

Everything lives in `.env` (copy `.env.example`). When the app starts it checks these and lists
anything missing or invalid.

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string |
| `DATABASE_DRIVER` | no | `neon` or `postgres`. Empty: guessed from the URL (`*.neon.tech` uses Neon's HTTP driver) |
| `BETTER_AUTH_SECRET` | yes | Random string, 32+ characters (command below) |
| `BETTER_AUTH_URL` | yes | Where the app runs, no trailing slash: `https://app.yourbrand.com` |
| `RESEND_API_KEY` | production | Resend API key. Without it emails are printed in the terminal |
| `EMAIL_FROM` | production | Sender, e.g. `YourBrand <hello@yourbrand.com>`, on a domain verified in Resend |
| `DEMO_MODE` | no | `true` for a public demo (see below). Never on for a real app |
| `BILLING_PROVIDER` | yes | `polar`, `stripe`, or `none` (billing off, every workspace gets everything) |
| `POLAR_*` / `STRIPE_*` | for your provider | See "Billing" |

Generate a `BETTER_AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deploy option A: Vercel + Neon

1. Push the code to a **private** GitHub repository and import it in Vercel.
2. Create a Neon database and run `npm run db:migrate` against it once (set `DATABASE_URL`
   in your `.env` to the production database, or run it from CI).
3. In Vercel, add the environment variables (a **new** `BETTER_AUTH_SECRET`, and
   `BETTER_AUTH_URL` set to your real domain).
4. Point your billing provider's webhook at `https://<your-domain>/api/webhooks/<polar|stripe>`.
5. Pick a Vercel region close to your Neon database.
6. Sign up on the live site and test the whole flow once, including an upgrade.

**Customers' custom domains on Vercel:** each domain must also be added to your Vercel project
(Project > Settings > Domains, or the Vercel API). Vercel then issues its certificate. Tell
customers to point a CNAME at `cname.vercel-dns.com` (Vercel shows the exact value).

## Deploy option B: Docker (any server, any Postgres)

`docker-compose.yml` runs the app with its own Postgres and applies migrations on every start.

```bash
cp .env.example .env            # fill it in; DATABASE_URL is set by docker-compose.yml
docker compose up -d --build    # the app listens on 127.0.0.1:3000 (only this machine)
docker compose run --rm migrate npm run db:seed   # optional: sample workspace
```

Set `POSTGRES_PASSWORD` in your shell or a `.env` next to the compose file to change the
database password. Use your own Postgres instead by removing the `db` service and setting
`DATABASE_URL` in `.env`.

**HTTPS and custom domains:** put [Caddy](https://caddyserver.com) in front. `deploy/Caddyfile`
serves your app domain and gets a certificate **automatically for every workspace's custom
domain** (it asks `/api/custom-domain-check` first, so only domains a workspace saved get one).
Customers point a CNAME at your app domain.

Always run Echoboard behind a proxy like Caddy, Nginx or Vercel: rate limits use the visitor
address the proxy adds (`x-forwarded-for`).

## Custom domains (for workspaces)

On the **Branding** page, a Pro workspace enters `feedback.theircompany.com`. In production
the domain can only be saved once its DNS points to your app **and** a TXT record proves it's
theirs (the page shows the exact `_portal-verify.` record to add), so nobody can claim someone
else's domain. The portal then works on that domain with clean links
(`/roadmap`, `/posts/...`); nothing else of your app is reachable there. Update emails link to
the workspace's domain. Changes take effect within a minute.

## The widget

The **Widget** page in each workspace shows the code to paste:

```html
<script src="https://app.yourbrand.com/widget.js" data-workspace="acme" async></script>
```

Options: `data-label`, `data-position="left"`, `data-color="#16a34a"`, and `data-button="false"`
to open it from your own link with `FeedbackWidget.open()`.

## Webhooks

Pro workspaces add up to 5 endpoints on the **Webhooks** page. Slack and Discord "incoming
webhook" URLs get a readable message; every other URL gets JSON:

```json
{
  "type": "post.created",
  "timestamp": "2026-10-09T12:00:00.000Z",
  "workspace": { "id": "...", "name": "Acme Inc.", "slug": "acme" },
  "data": { "post": { "id": "...", "title": "Dark mode", "status": "open", "url": "https://..." } }
}
```

Events: `post.created`, `comment.created`, `post.status_changed` (with `previousStatus`),
`changelog.published`. Requests are signed the [Standard Webhooks](https://www.standardwebhooks.com)
way (`webhook-id`, `webhook-timestamp`, `webhook-signature` headers), so receivers can check
them with any Standard Webhooks library and the secret shown on the page. Each event is sent
once, right after the change; the last result shows on the Webhooks page. Local and private
network addresses are refused.

## Billing (your customers pay you)

Plans, limits and the prices shown live in `src/lib/billing/plans.ts`. Free: 2 boards, 3 team
members. Pro: unlimited, plus custom domain, no "Powered by", webhooks. Change them freely; the
server enforces whatever is there. If a workspace leaves Pro, its custom domain and hidden
branding switch off by themselves.

### Polar (default)

1. Create an organization at https://sandbox.polar.sh for testing (https://polar.sh for real money).
2. Create a product "Pro" with a **monthly** price. Add a free trial on the product if you want one.
3. Set `POLAR_SERVER` (`sandbox` or `production`), `POLAR_ACCESS_TOKEN` (Settings > Developers)
   and `POLAR_PRO_PRODUCT_ID`.
4. Add a webhook to `https://<your-domain>/api/webhooks/polar` (format Raw) with all the
   `subscription.*` events, and copy its secret into `POLAR_WEBHOOK_SECRET`.
5. Settings > Subscriptions: turn on **Allow multiple subscriptions**, so one person can pay for
   several workspaces. The app still blocks a second subscription for the same workspace.

### Stripe

1. In test mode, create a product "Pro" with a **recurring monthly** price and copy the price ID
   (`price_...`) into `STRIPE_PRO_PRICE_ID`, and your secret key into `STRIPE_SECRET_KEY`.
2. Turn on the customer portal once: Settings > Billing > Customer portal > Save.
3. Add a webhook to `https://<your-domain>/api/webhooks/stripe` with the
   `customer.subscription.*` and `checkout.session.completed` events; copy the signing secret
   into `STRIPE_WEBHOOK_SECRET`.
4. Optional: `STRIPE_TRIAL_DAYS` for a free trial.

### No billing

`BILLING_PROVIDER="none"`: no payment keys needed, every workspace gets every Pro feature, and
the pricing section is hidden. Good for running Echoboard for your own company.

## Emails (Resend)

1. Create an account at https://resend.com and an API key.
2. Verify your domain in Resend and set `EMAIL_FROM` to an address on it.
   (`onboarding@resend.dev` only delivers to your own Resend email address.)

Update emails go out in batches of 100 after the page responds; each workspace can send at most
30 updates per hour.

## Public demo (`DEMO_MODE`)

Set `DEMO_MODE="true"` on a demo deployment and run `npm run db:seed`: a banner shows the sample
workspace's login, sign-up skips email verification, no emails are sent, the Billing page shows
a test card, and webhooks and custom domains are turned off so visitors can't misuse them.
Run `npm run db:reset-demo` (for example every night) to put the sample workspace back to its
original state. Never turn demo mode on for a real app.

## Make it yours

- **Name, tagline, company, support email:** `src/config/site.ts`
- **Logo in the app:** `src/components/logo.tsx`
- **Colors and dark mode:** the color tokens in `src/app/globals.css` (`--primary` for buttons)
- **Plans, prices, limits:** `src/lib/billing/plans.ts` (set the real price in Polar or Stripe)
- **Landing page:** `src/app/page.tsx`
- **Terms and Privacy:** `src/app/terms` and `src/app/privacy` are templates, not legal advice.
  Have them reviewed before launch.
- **Roles and permissions:** `src/lib/permissions.ts`

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
| `npm run db:seed` | Add the sample workspace (safe to run again; refuses a database that already has real accounts, unless `DEMO_MODE="true"`) |
| `npm run db:reset-demo` | Delete the sample workspace and add it again, fresh |

## Project structure

```
src/
  app/
    page.tsx              your landing page
    dashboard/[slug]/     a workspace's dashboard (feedback, boards, changelog, widget,
                          branding, webhooks, members, billing, settings)
    p/[org]/              public portal (feedback, posts, roadmap, changelog)
    embed/[org]/          the widget panel
    api/                  widget data, webhooks from Polar/Stripe, unsubscribe, domain check
  components/             shared UI; ui/ has Button, Input, SubmitButton; portal/ the portal's
  db/                     schema/ (one file per area), connection, transactions, seed
  lib/                    feedback, portal, notifications, webhooks, billing, auth, helpers
  proxy.ts                custom domains, login redirects
public/widget.js          the script customers paste into their websites
drizzle/                  database migrations
deploy/Caddyfile          HTTPS for your domain and every custom domain
Dockerfile, docker-compose.yml
```

## Good to know

- Anyone can vote without an account, so a determined person can vote many times (new browser,
  cleared storage). Votes are rate limited per address; treat counts as a strong signal, not an
  election. Names and emails people leave help you spot real customers.
- `npm audit` reports 0 vulnerabilities. `package.json` pins a newer `esbuild` for `drizzle-kit`
  through `overrides`; re-check `npm audit` after installing new packages.
- In development the database is far away compared to production, so pages feel slower locally.

## Support

Questions and bug reports are welcome as GitHub issues. For bugs, include the steps to
reproduce and any error message.

## License

MIT; see [LICENSE](LICENSE).
