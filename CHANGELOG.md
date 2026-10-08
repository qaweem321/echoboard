# Changelog

Notable changes for buyers of Echoboard. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
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

### Foundation
- Built on StarterKit 1.0.0: accounts, organizations with roles and invitations, Polar or Stripe
  billing, emails, security headers, rate limits and environment checks.
