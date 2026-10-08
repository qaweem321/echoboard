import { createHash, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  accounts,
  boards,
  memberships,
  organizations,
  posts,
  users,
  voters,
  votes,
} from "./schema";

// Every demo member logs in with this password (local development and the public demo only).
export const DEMO_PASSWORD = "echoboard-demo";

const demoMembers = [
  { name: "Olivia Owner", email: "owner@acme.test", role: "owner" },
  { name: "Adam Admin", email: "admin@acme.test", role: "admin" },
  { name: "Maya Member", email: "maya@acme.test", role: "member" },
  { name: "Sam Member", email: "sam@acme.test", role: "member" },
] as const;

async function seed() {
  await db
    .insert(organizations)
    .values({ name: "Acme Inc.", slug: "acme" })
    .onConflictDoNothing({ target: organizations.slug });

  const [acme] = await db.select().from(organizations).where(eq(organizations.slug, "acme"));

  await db
    .insert(users)
    .values(
      demoMembers.map((m) => ({
        id: randomUUID(),
        name: m.name,
        email: m.email,
        emailVerified: true,
      })),
    )
    .onConflictDoNothing({ target: users.email });

  const savedUsers = await db
    .select()
    .from(users)
    .where(
      inArray(
        users.email,
        demoMembers.map((m) => m.email),
      ),
    );

  // Password logins for the demo members, so the dashboard can be tried right away.
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await db
    .insert(accounts)
    .values(
      savedUsers.map((user) => ({
        id: `seed-${user.id}`,
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
      })),
    )
    .onConflictDoNothing({ target: accounts.id });

  await db
    .insert(memberships)
    .values(
      demoMembers.map((m) => {
        const user = savedUsers.find((u) => u.email === m.email);
        if (!user) {
          throw new Error(`Seed user ${m.email} was not saved.`);
        }
        return { organizationId: acme.id, userId: user.id, role: m.role };
      }),
    )
    .onConflictDoNothing({ target: [memberships.organizationId, memberships.userId] });

  // Demo feedback, only added once: two boards, posts in every status, and votes.
  if ((await db.$count(boards, eq(boards.organizationId, acme.id))) === 0) {
    await seedFeedback(acme.id);
  }

  console.log(`Seeded ${acme.name} with ${demoMembers.length} members and demo feedback.`);
}

const demoPosts = [
  { board: 0, title: "Dark mode for the mobile app", status: "planned", votes: 5 },
  { board: 0, title: "Export reports to CSV", status: "in_progress", votes: 4 },
  { board: 0, title: "Slack notifications for new comments", status: "under_review", votes: 3 },
  { board: 0, title: "Keyboard shortcuts", status: "open", votes: 2 },
  { board: 0, title: "Two-factor login", status: "complete", votes: 5 },
  { board: 1, title: "Search ignores accented letters", status: "open", votes: 1 },
  { board: 1, title: "Invoice PDF shows the wrong date", status: "closed", votes: 0 },
] as const;

async function seedFeedback(organizationId: string) {
  const boardIds = [randomUUID(), randomUUID()];
  // Anonymous portal visitors; their cookie tokens are random and never used again.
  const voterIds = Array.from({ length: 5 }, () => randomUUID());
  const postIds = demoPosts.map(() => randomUUID());

  await db.batch([
    db.insert(boards).values([
      {
        id: boardIds[0],
        organizationId,
        name: "Feature requests",
        slug: "feature-requests",
        description: "Ideas to make the product better.",
      },
      { id: boardIds[1], organizationId, name: "Bugs", slug: "bugs", description: null },
    ]),
    db.insert(voters).values(
      voterIds.map((id) => ({
        id,
        organizationId,
        tokenHash: createHash("sha256").update(randomUUID()).digest("hex"),
      })),
    ),
    db.insert(posts).values(
      demoPosts.map((post, i) => ({
        id: postIds[i],
        organizationId,
        boardId: boardIds[post.board],
        title: post.title,
        status: post.status,
        voteCount: post.votes,
      })),
    ),
    db
      .insert(votes)
      .values(
        demoPosts.flatMap((post, i) =>
          voterIds.slice(0, post.votes).map((voterId) => ({ postId: postIds[i], voterId })),
        ),
      ),
  ]);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
