"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { atomic } from "@/db/atomic";
import { boards, memberships, organizations } from "@/db/schema";
import { starterBoard } from "@/lib/board";
import { isUniqueViolation } from "@/lib/db-errors";
import { checkOrganizationName } from "@/lib/organization-name";
import { rateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";
import { slugify } from "@/lib/slug";

export type CreateOrganizationState = { error?: string };

export async function createOrganization(
  _previous: CreateOrganizationState,
  formData: FormData,
): Promise<CreateOrganizationState> {
  const user = await requireUser();

  const checked = checkOrganizationName(formData.get("name"));
  if ("error" in checked) {
    return checked;
  }
  const { name } = checked;

  // Stops scripts from creating workspaces in bulk.
  const { allowed } = await rateLimit(`create-organization:${user.id}`, 10, 60 * 60);
  if (!allowed) {
    return { error: "Too many new workspaces. Please try again in an hour." };
  }

  const base = slugify(name);
  const taken = await db.$count(organizations, eq(organizations.slug, base));
  let slug = taken > 0 ? withSuffix(base) : base;
  try {
    await insertWorkspace(name, slug, user.id);
  } catch (error) {
    // Someone took the same name at the same moment: try once more with a suffix.
    if (!isUniqueViolation(error)) {
      throw error;
    }
    slug = withSuffix(base);
    await insertWorkspace(name, slug, user.id);
  }

  redirect(`/dashboard/${slug}`);
}

function withSuffix(slug: string) {
  return `${slug}-${randomUUID().slice(0, 6)}`;
}

// Every workspace starts with one board, so its portal and widget work right away.
async function insertWorkspace(name: string, slug: string, ownerId: string) {
  const organizationId = randomUUID();
  await atomic((tx) => [
    tx.insert(organizations).values({ id: organizationId, name, slug }),
    tx.insert(memberships).values({ organizationId, userId: ownerId, role: "owner" }),
    tx.insert(boards).values({ organizationId, ...starterBoard }),
  ]);
}
