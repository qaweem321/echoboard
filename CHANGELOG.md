# Changelog

Notable changes for buyers of Echoboard. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-09

First public version.

### Feedback boards
- Feedback boards per workspace: add, rename and delete (owners and admins). A board keeps its
  link when renamed.
- Database tables for posts (with statuses), votes, comments and portal voters.
- Overview page shows boards and feedback posts.
- Demo data (`npm run db:seed`): Acme Inc. with two boards, posts in every status and votes;
  demo members can log in with the password in `src/db/seed.ts`.

### Public portal
- Each workspace has a public feedback portal at `/p/<workspace>`: all boards or one board,
  Top and New sorting, search, and pages of 30.
- Visitors share ideas, vote and comment without an account. Name and email are optional
  (the email is for update notifications). Votes flip instantly and can be taken back.
- Post pages with status, author, details and comments; team members are marked "Team".
- Spam protection: limits per visitor IP for votes, new ideas and comments.
- "Open public portal" link in the dashboard, and board names link to their portal page.

### Team tools
- Feedback inbox in the dashboard: filter by status and board, search, sort by newest or most
  votes, pages of 50. Filters live in the link, so a view can be bookmarked.
- Post page for the team: change status, board, title and details in one save; see comments
  and the voters who left a name or email.
- Merge duplicates: votes move to the main post without counting anyone twice, comments move
  too, and the duplicate's link opens the main post.
- Owners and admins can delete posts and comments (with "Are you sure?"); every member can
  triage.

### Public roadmap
- `/p/<workspace>/roadmap`: Planned, In progress and Complete columns, most-voted first, with
  voting right on the cards.

### Changelog and voter emails
- Changelog in the dashboard: drafts, publish, unpublish, delete, and link the ideas an entry
  ships. Public changelog at `/p/<workspace>/changelog`, with a page per entry.
- Publishing can mark the linked ideas Complete and email everyone who voted for them, with a
  link to the announcement. Ideas already Complete are skipped, so nobody gets the news twice.
- Changing a post's status (Under review, Planned, In progress, Complete) can email its voters;
  the post page shows how many people that reaches.
- One email per person even when several of their ideas changed; voters from several browsers
  with the same email get one email.
- Every update email has an unsubscribe link (with a confirm click, so email scanners can't
  unsubscribe people) and a one-click unsubscribe header for mail apps.
- Emails go out in batches of 100 after the page responds, and each workspace can send at most
  30 updates per hour.

### Embeddable widget
- One script tag adds a Feedback button to any website; it opens a panel where visitors vote,
  search and share ideas without leaving the page or creating an account.
- Options: button text, left or right corner, button color, or no button (open it from your
  own link with `FeedbackWidget.open()`). Esc and the close button close the panel.
- The panel works even where third-party cookies are blocked (Safari, Firefox).
- New Widget page in the dashboard with the code to copy and a preview link.
- Only the widget panel may be shown inside other websites; every other page still refuses to
  be framed.

### White-label branding
- New Branding page: brand color (buttons, votes and selected tabs, with text that stays
  readable), logo link, and hiding the "Powered by" line.
- Custom domains: a workspace can show its portal on its own address (e.g.
  feedback.yourcompany.com) with clean links; a DNS check says whether the CNAME is set up.
  Only that workspace's portal is reachable on its domain.
- Update emails link to the workspace's own domain when it has one.
- The widget panel uses the brand color, and the widget code includes it for the button.
- "Powered by" links to your own site.

### Plans, webhooks and similar ideas
- Plan limits in one file (`src/lib/billing/plans.ts`), checked on the server: Free has 2 boards
  and 3 team members; Pro adds unlimited boards and members, a custom domain, hiding "Powered
  by", and webhooks. Pricing cards list the limits. After a downgrade, the custom domain and
  hidden branding switch off on their own.
- Webhooks page (owners and admins): up to 5 endpoints, a "Send test" button, the last
  delivery result, and the signing secret. Slack and Discord addresses get a readable message
  in the channel; other addresses (Zapier, Make, your own app) get JSON events signed the
  Standard Webhooks way: `post.created`, `comment.created`, `post.status_changed`,
  `changelog.published`.
- Webhooks can't be pointed at local or private network addresses.
- "Similar ideas already shared" hints while typing a new idea, in the portal and the widget,
  so people vote instead of posting duplicates.

### Self-hosting and shipping
- Runs on any Postgres, not only Neon: a normal connection for every other database
  (`DATABASE_DRIVER` to choose), with real transactions. Migrations work everywhere.
- Docker: `Dockerfile` and `docker-compose.yml` (app, Postgres, migrations on start), and a
  Caddy example with automatic HTTPS for every workspace's custom domain.
- `BILLING_PROVIDER="none"` turns billing off: every workspace gets all features and the
  pricing section is hidden.
- Demo mode shows the sample workspace's login, hides the banner inside the widget, and turns
  off webhooks and custom domains; `npm run db:reset-demo` restores the sample workspace.
- Custom domains can only be saved once their DNS points to the app (no claiming other
  companies' domains). Rate limits use the address added by the nearest proxy.
- New landing page, README and a commercial license (own use, clients, or your own hosted service).

### Polish
- New workspaces start with a "Feature requests" board, and the Overview shows a Get started guide until the first feedback arrives.
- The app says "workspace" everywhere (it said "organization" in a few places).
- Free plan allows 2 boards; the sample workspace fits the Free plan.
- The widget panel is kept out of search engines.
- Escape closes the widget panel even while typing inside it.
- A changelog entry can link any idea except closed ones, so an idea can ship straight from Open.
- The Billing page says clearly when Pro was cancelled ("Cancelled: Pro ends on ..., then you're back on Free"), also during a free trial.

### Foundation
- Built on StarterKit 1.0.0: accounts, organizations with roles and invitations, Polar or Stripe
  billing, emails, security headers, rate limits and environment checks.
