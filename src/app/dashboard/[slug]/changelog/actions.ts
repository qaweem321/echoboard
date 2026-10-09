"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { atomic } from "@/db/atomic";
import { changelogEntries, changelogEntryPosts, posts } from "@/db/schema";
import { checkEntryInput } from "@/lib/changelog/input";
import { emailVoters } from "@/lib/notifications/voter-updates";
import { refreshPortal } from "@/lib/portal/refresh";
import { requirePermission } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

function refresh(slug: string) {
  revalidatePath(`/dashboard/${slug}/changelog`, "layout");
  refreshPortal(slug);
}

// Checks the permission and that the entry (ID from the browser) belongs to this workspace.
async function requireEntry(formData: FormData) {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "changelog:manage");
  const entryId = formData.get("entryId");
  const [entry] = isUuid(entryId)
    ? await db
        .select({ id: changelogEntries.id, publishedAt: changelogEntries.publishedAt })
        .from(changelogEntries)
        .where(
          and(
            eq(changelogEntries.id, entryId),
            eq(changelogEntries.organizationId, organization.id),
          ),
        )
        .limit(1)
    : [];
  if (!entry) {
    throw new Error("Changelog entry not found.");
  }
  return { slug, organization, entry };
}

export type NewEntryState = { error?: string; title?: string };

export async function createEntry(
  _previous: NewEntryState,
  formData: FormData,
): Promise<NewEntryState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "changelog:manage");
  const input = checkEntryInput(formData.get("title"), "");
  if ("error" in input) {
    return { error: input.error, title: String(formData.get("title") ?? "") };
  }
  const [entry] = await db
    .insert(changelogEntries)
    .values({ organizationId: organization.id, title: input.title })
    .returning({ id: changelogEntries.id });
  refresh(slug);
  redirect(`/dashboard/${slug}/changelog/${entry.id}`);
}

export type EntryFormState = { error?: string; saved?: string };

export async function saveEntry(
  _previous: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const { slug, organization, entry } = await requireEntry(formData);
  const input = checkEntryInput(formData.get("title"), formData.get("body"));
  if ("error" in input) {
    return { error: input.error };
  }
  const publish = formData.get("intent") === "publish";
  const shipLinked = publish && formData.get("shipLinked") === "on";

  // Keep only linked ideas that really belong to this workspace.
  const requestedIds = formData.getAll("postIds").filter(isUuid);
  const linked =
    requestedIds.length > 0
      ? await db
          .select({ id: posts.id, status: posts.status })
          .from(posts)
          .where(and(inArray(posts.id, requestedIds), eq(posts.organizationId, organization.id)))
      : [];
  const linkedIds = linked.map((post) => post.id);
  // Only ideas that weren't complete yet are news for their voters.
  const newlyShipped = shipLinked
    ? linked.filter((post) => post.status !== "complete").map((post) => post.id)
    : [];
  const now = new Date();

  await atomic((tx) => [
    tx
      .update(changelogEntries)
      .set({
        title: input.title,
        body: input.body,
        publishedAt: publish ? (entry.publishedAt ?? now) : entry.publishedAt,
        updatedAt: now,
      })
      .where(eq(changelogEntries.id, entry.id)),
    tx.delete(changelogEntryPosts).where(eq(changelogEntryPosts.entryId, entry.id)),
    ...(linkedIds.length > 0
      ? [
          tx
            .insert(changelogEntryPosts)
            .values(linkedIds.map((postId) => ({ entryId: entry.id, postId }))),
        ]
      : []),
    ...(newlyShipped.length > 0
      ? [
          tx
            .update(posts)
            .set({ status: "complete", updatedAt: now })
            .where(and(inArray(posts.id, newlyShipped), ne(posts.status, "complete"))),
        ]
      : []),
  ]);
  refresh(slug);

  if (!publish) {
    return { saved: "Saved." };
  }
  if (newlyShipped.length === 0) {
    return { saved: "Published." };
  }
  const result = await emailVoters({
    organization,
    postIds: newlyShipped,
    status: "complete",
    announcement: { id: entry.id, title: input.title },
  });
  if ("error" in result) {
    return { saved: `Published. ${result.error}` };
  }
  const shipped = `${newlyShipped.length} ${newlyShipped.length === 1 ? "idea" : "ideas"} marked Complete`;
  const emailed =
    result.sent === 0
      ? "no voters left an email"
      : `emailing ${result.sent} ${result.sent === 1 ? "voter" : "voters"}`;
  return { saved: `Published. ${shipped}; ${emailed}.` };
}

export async function unpublishEntry(formData: FormData) {
  const { slug, entry } = await requireEntry(formData);
  await db
    .update(changelogEntries)
    .set({ publishedAt: null, updatedAt: new Date() })
    .where(eq(changelogEntries.id, entry.id));
  refresh(slug);
}

export async function deleteEntry(formData: FormData) {
  const { slug, entry } = await requireEntry(formData);
  await db.delete(changelogEntries).where(eq(changelogEntries.id, entry.id));
  refresh(slug);
  redirect(`/dashboard/${slug}/changelog`);
}
