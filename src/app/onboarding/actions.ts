"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { atomic } from "@/db/atomic";
import { boards, memberships, organizations } from "@/db/schema";
import { starterBoard } from "@/lib/board";
import { checkOrganizationName } from "@/lib/organization-name";
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

  let slug = slugify(name);
  const taken = await db.$count(organizations, eq(organizations.slug, slug));
  if (taken > 0) {
    slug = `${slug}-${randomUUID().slice(0, 6)}`;
  }

  const organizationId = randomUUID();
  // Every workspace starts with one board, so its portal and widget work right away.
  await atomic((tx) => [
    tx.insert(organizations).values({ id: organizationId, name, slug }),
    tx.insert(memberships).values({ organizationId, userId: user.id, role: "owner" }),
    tx.insert(boards).values({ organizationId, ...starterBoard }),
  ]);

  redirect(`/dashboard/${slug}`);
}
