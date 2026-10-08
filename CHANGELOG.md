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

### Foundation
- Built on StarterKit 1.0.0: accounts, organizations with roles and invitations, Polar or Stripe
  billing, emails, security headers, rate limits and environment checks.
