# Design decisions

Why Echoboard is built the way it is, and what each choice costs. Each section answers a question an
interviewer or contributor is likely to ask.

## 1. How are workspaces kept apart?

One database, shared tables, and an `organization_id` on every row (directly, or through its post). Every
dashboard page and action starts with `requireMembership(slug)`, which loads the workspace and the
user's membership in one join; a user who isn't a member gets a 404, the same as a workspace that doesn't
exist. Portal actions check that a post id from the browser belongs to the workspace before using it.

Roles (owner, admin, member) and what each may do live in one table in `src/lib/permissions.ts`.
Removing or demoting an owner is one SQL statement that locks the workspace's owner rows first, so two
owners removing each other at the same moment can't leave a workspace without one.

**Trade-off:** isolation depends on every query filtering by workspace, not on the database (no
row-level security). Schema-per-tenant or a database per tenant would be stronger but much heavier to
run and migrate.

## 2. How can people vote without an account?

Visitors are not accounts. On their first vote or comment they get a random 32-byte token: in an
`httpOnly` cookie on the portal, or in the widget's own storage (see 5). The database stores only
`sha256(workspaceId + ":" + token)`, so:

- a database leak doesn't reveal tokens anyone could reuse;
- the same browser is a different voter in every workspace, so workspaces can't link visitors.

Creating or updating the voter is one `INSERT ... ON CONFLICT DO UPDATE`; a name or email typed later
is added without wiping what was saved before. Abuse is limited per IP and workspace (60 votes a minute,
5 posts and 10 comments per 10 minutes).

**Trade-off:** clearing cookies or switching browsers gives a new voter, so someone can vote twice on
purpose. For product feedback that is acceptable; requiring sign-up would cost far more votes than it
saves.

## 3. How do vote counts stay correct?

`posts.vote_count` and `comment_count` are stored, so lists sort by votes using an index instead of
counting rows. To keep them from drifting, every change sets the count from the rows themselves
(`vote_count = (select count(*) from votes where post_id = posts.id)`) in the same transaction, and the
transaction first locks the post (`SELECT ... FOR UPDATE`). Without the lock, two votes at the same
moment would each count without seeing the other and end one too low. Posts are locked in id order, so
two transactions can't deadlock.

A unique key on `(post_id, voter_id)` with `ON CONFLICT DO NOTHING` makes a double click count once.

## 4. How does merging duplicates work?

`mergePosts` runs in one transaction: the duplicate's voters are copied onto the main post (once each,
thanks to the unique key, so nobody is counted twice), comments move over, posts merged into the
duplicate earlier now point at the main post, and both counts are recomputed. The duplicate stays,
hidden, with `merged_into_id` set, so old links redirect.

Every statement also checks that neither post was merged in the meantime. Without that, merging A into B
and B into A at the same moment would make each redirect to the other forever.

## 5. Why is the widget an iframe, and why doesn't it use cookies?

`widget.js` is one `<script>` tag that adds a button and an iframe pointing at `/embed/<workspace>`. An
iframe means the host site's CSS can't break the panel and the panel can't read the host page.

Inside another website, Safari and Firefox block third-party cookies, so the portal's cookie wouldn't
work there. The widget keeps the voter token in its own `localStorage` and sends it in an
`x-voter-token` header. If storage is blocked too, the token lives until the page closes.

Only `/embed/...` pages may be framed (`frame-ancestors *`); every other page sends
`frame-ancestors 'none'` and `X-Frame-Options: DENY` against clickjacking.

## 6. How do custom domains work?

`src/proxy.ts` runs on every request. When the host isn't the app's own, it looks the host up and
rewrites `feedback.acme.com/roadmap` to `/p/acme/roadmap`. Anything else requested on that domain
(dashboard, login, other workspaces) lands under that workspace's portal path, where it doesn't exist:
a 404, never another workspace's data. The proxy also deletes any incoming `x-portal-domain` header
before setting its own, so a visitor can't fake being on a custom domain.

The lookup is cached in memory for a minute (at most 1,000 entries, oldest dropped first), so the proxy
doesn't query the database on every request. A workspace that leaves Pro stops being served on its
domain.

Saving a domain in production needs two DNS checks: the domain points at the app, and a TXT record
`_portal-verify.<domain>` holds an HMAC of the workspace id and domain. Pointing alone isn't proof,
because on shared hosting unrelated sites share IP addresses. For Docker, Caddy asks
`/api/custom-domain-check` before issuing a certificate, so certificates are only issued for domains a
workspace really uses.

**Trade-off:** a changed domain takes up to a minute to work (or stop working) on each server instance.

## 7. How do voters hear that their idea shipped?

When a post moves to Under review, Planned, In progress or Complete (or a changelog entry ships it), the
team can email its voters. Recipients are found in one query and grouped by email address, so someone
who voted from two browsers, or for several of the shipped ideas, gets one email listing them all.
Emails go out after the response (`after()`), so the page stays fast.

Each email has an unsubscribe link signed with an HMAC of the voter id (compared in constant time), so
no table of tokens is needed and nobody can unsubscribe someone else by guessing ids. It also carries the
`List-Unsubscribe` and one-click (RFC 8058) headers that Gmail and Yahoo require.

Sends are limited to 30 per workspace per hour, so a mistake or a compromised account can't flood
inboxes.

## 8. How are webhooks delivered safely?

Pro workspaces can add endpoints. Each event is signed the Standard Webhooks way (HMAC-SHA256 of
`id.timestamp.body` in the `webhook-signature` header), so receivers can verify it with any Standard
Webhooks library. Slack and Discord URLs get a readable message instead of raw JSON.

Users type in URLs the server then calls, which is the setup for server-side request forgery (for
example `http://169.254.169.254/` to read cloud credentials). Three checks prevent it:

- Saved URLs must be `https` and not a private, loopback, link-local or reserved address.
- At send time, the DNS lookup for the connection itself refuses private addresses. Checking first and
  letting the request look the name up again would let a domain answer differently the second time
  (DNS rebinding).
- Redirects are not followed.

Deliveries run after the response, with a 5-second timeout, so a slow endpoint never slows a page.

**Trade-off:** one attempt per event, no retry queue. The last result shows on the Webhooks page. A queue
with retries would need a worker process, which this app doesn't have.

## 9. How does billing stay in sync with Stripe or Polar?

Billing is behind one small interface (`createCheckoutUrl`, `createPortalUrl`, `fetchSubscription`) with
a Polar and a Stripe implementation; `BILLING_PROVIDER` picks one, or `none` turns billing off and
gives every workspace every feature.

The billing webhooks don't trust the event's contents. They only use it to find the workspace, then
`syncSubscription` fetches the current subscription from the provider and upserts it. Events can arrive
late or out of order; fetching the current state makes that harmless, and running it twice gives the
same result.

Plan limits live in one file (`src/lib/billing/plans.ts`) and are checked on the server. The wording on
the Billing page is derived from the real status (trialing, active, cancelled, past due, paused) by
pure, tested functions, so a cancelled trial says "Pro ends on ..., then you're back on Free", not
"Free trial ends on ...". A failed payment shows "Manage subscription" (fix the card) instead of
"Upgrade", and the server refuses a second checkout.

**Trade-off:** one extra API call to the provider per webhook. The board and member limits are a count
followed by an insert, so two requests at exactly the same moment could both pass; for a plan limit
that is acceptable.

## 10. How does "Similar ideas already shared" work?

While someone types a title, the portal searches existing titles with Postgres full-text search, backed
by a GIN index on `to_tsvector('english', title)`. The typed text is reduced to at most six words of
three or more letters and digits, each matched as a prefix (`export:* | csv:*`), so the query is always
valid and safe. Results are ranked by `ts_rank`, then votes.

**Trade-off:** word matching, not meaning: "dark theme" doesn't find "night mode". Embeddings would,
but would need an AI provider and a vector index for a hint.

## 11. Why two database drivers, and how is rate limiting stored?

On Vercel, Neon's HTTP driver is fastest; on Docker or any other Postgres, `postgres.js` is used.
`DATABASE_URL` (or `DATABASE_DRIVER`) decides. Neon over HTTP can only run a batch of statements
prepared up front, so `atomic()` in `src/db/atomic.ts` runs a list of statements as `db.batch` on Neon
or as a normal transaction elsewhere. That is why votes, merges and comments are written as a fixed list
of statements with the checks inside the SQL.

Rate limits live in a Postgres table (shared with Better Auth), updated with one upsert per check. That
works across serverless instances without Redis.

**Trade-off:** one database round trip per rate-limited action.

## 12. How is it tested?

Rules live in small pure functions with tests next to them: plans and billing wording, permissions,
custom-domain paths, the DNS verification value, webhook URL checks, private-address detection and
signatures, unsubscribe tokens, recipient grouping, the similar-ideas query, voter tokens, slugs and
safe redirects. They run with Node's built-in test runner (`tsx --test`), with no database.
`npm run check` runs the typecheck, Biome, the tests and a production build, and CI runs `npm audit` and
the same check.
