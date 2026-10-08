import { and, countDistinct, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { after } from "next/server";
import { absoluteUrl } from "@/config/site";
import { db } from "@/db";
import { posts, voters, votes } from "@/db/schema";
import { sendEmails } from "@/lib/email";
import { requireEnv } from "@/lib/env";
import { type PostStatus, postStatusLabels } from "@/lib/post-status";
import { rateLimit } from "@/lib/rate-limit";
import { signUnsubscribe } from "@/lib/unsubscribe-token";
import { groupRecipients } from "./recipients";
import { buildUpdateEmail } from "./update-email";

// Statuses worth an email. "Open" and "Closed" are not news for voters.
export const notifiableStatuses: readonly PostStatus[] = [
  "under_review",
  "planned",
  "in_progress",
  "complete",
];

// At most this many update sends per workspace per hour, so a mistake (or a compromised
// account) can't flood people's inboxes.
const SENDS_PER_HOUR = 30;

function reachableVoters(organizationId: string, postIds: string[]) {
  return and(
    inArray(votes.postId, postIds),
    eq(posts.organizationId, organizationId),
    isNotNull(voters.email),
    isNull(voters.unsubscribedAt),
  );
}

// How many people an update about this post would reach (for the "Email N voters" checkbox).
export async function countReachableVoters(organizationId: string, postId: string) {
  const [row] = await db
    .select({ count: countDistinct(voters.email) })
    .from(votes)
    .innerJoin(voters, eq(voters.id, votes.voterId))
    .innerJoin(posts, eq(posts.id, votes.postId))
    .where(reachableVoters(organizationId, [postId]));
  return row?.count ?? 0;
}

type VoterUpdate = {
  organization: { id: string; name: string; slug: string };
  postIds: string[];
  status: PostStatus;
  announcement?: { id: string; title: string };
};

// Emails everyone who voted for these posts (and left an email) about their new status.
// Recipients are found now; the emails go out after the response, so the page stays fast.
// Returns how many people will get an email, or an error message.
export async function emailVoters(
  update: VoterUpdate,
): Promise<{ sent: number } | { error: string }> {
  const { organization, postIds, status, announcement } = update;
  if (postIds.length === 0) {
    return { sent: 0 };
  }
  if (!(await rateLimit(`notify:${organization.id}`, SENDS_PER_HOUR, 3600)).allowed) {
    return { error: "You've sent a lot of updates this hour. Saved, but no emails were sent." };
  }

  const rows = await db
    .select({
      voterId: voters.id,
      email: voters.email,
      name: voters.name,
      postId: posts.id,
      title: posts.title,
    })
    .from(votes)
    .innerJoin(voters, eq(voters.id, votes.voterId))
    .innerJoin(posts, eq(posts.id, votes.postId))
    .where(reachableVoters(organization.id, postIds));

  const recipients = groupRecipients(
    rows.flatMap((row) => (row.email ? [{ ...row, email: row.email }] : [])),
  );
  if (recipients.length === 0) {
    return { sent: 0 };
  }

  const secret = requireEnv("BETTER_AUTH_SECRET");
  const portal = `/p/${organization.slug}`;
  const emails = recipients.map((recipient) => {
    const query = `?v=${recipient.voterId}&t=${signUnsubscribe(recipient.voterId, secret)}`;
    const unsubscribeUrl = absoluteUrl(`/unsubscribe${query}`);
    return {
      to: recipient.email,
      ...buildUpdateEmail({
        organizationName: organization.name,
        recipientName: recipient.name,
        statusLabel: postStatusLabels[status],
        posts: recipient.posts.map((post) => ({
          title: post.title,
          url: absoluteUrl(`${portal}/posts/${post.id}`),
        })),
        announcement: announcement && {
          title: announcement.title,
          url: absoluteUrl(`${portal}/changelog/${announcement.id}`),
        },
        unsubscribeUrl,
      }),
      // Lets mail apps show their own "Unsubscribe" button (one click, RFC 8058).
      headers: {
        "List-Unsubscribe": `<${absoluteUrl(`/api/unsubscribe${query}`)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  });

  after(async () => {
    try {
      await sendEmails(emails);
    } catch (error) {
      console.error("Sending voter updates failed:", error);
    }
  });
  return { sent: recipients.length };
}
