# Echoboard build plan

Echoboard is a white-label feedback, roadmap and changelog app that buyers can rebrand and run
as their own SaaS (sold with a commercial license, unlike the AGPL tools Quackback and
openheard). It reuses the StarterKit foundation: accounts, organizations, roles, billing.

Each **organization** is one customer workspace (a company collecting feedback). Its team logs
into the dashboard; its users vote and comment on a public portal without creating an account.

| Phase | What gets built | Status |
| --- | --- | --- |
| 1 | Foundation: project from StarterKit, rebrand, feedback data model, boards in the dashboard | Done |
| 2 | Public portal: board pages, post ideas, zero-signup voting, comments, sort and search | Done |
| 3 | Team tools: feedback inbox, statuses, edit/delete, merge duplicates, public roadmap | Done |
| 4 | Changelog, and "shipped" emails to everyone who voted (with unsubscribe) | |
| 5 | Embeddable widget (one script tag) with zero-signup voting | |
| 6 | White-label: logo and colors per workspace, custom domains, portal languages | |
| 7 | Billing for the buyer's customers (plan limits), outgoing webhooks, Slack, duplicate hints | |
| 8 | Ship it: Docker and self-host Postgres, demo mode and seed, docs, license, release zip | |

## Key decisions

- **Foundation:** copied from StarterKit 1.0.0 (Next.js 16, Better Auth, Drizzle, Polar/Stripe)
  so auth, teams and billing are already tested. Git history starts fresh.
- **Voters are not users.** Portal visitors get a `voters` row tied to one organization,
  identified by a random browser cookie, optionally with a name and email. This keeps voting
  signup-free and keeps team accounts (Better Auth) separate.
- **Counts are stored** on posts (`vote_count`, `comment_count`) so board pages sort and render
  with one query instead of counting on every page view.
- **Merging keeps the duplicate** (hidden, with `merged_into_id`) so old links redirect to the
  main post; its voters are added to the main post once each and its comments move over.
- **Statuses are fixed** (open, under review, planned, in progress, complete, closed) so the
  roadmap and emails can rely on them. Custom statuses can come later if buyers ask.
