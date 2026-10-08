"use server";

import { and, eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { boards } from "@/db/schema";
import { checkBoardInput, uniqueSlug } from "@/lib/board";
import { requirePermission } from "@/lib/session";
import { slugify } from "@/lib/slug";

// On error, the typed values are sent back so the form can show them again.
export type BoardFormState = {
  error?: string;
  saved?: boolean;
  name?: string;
  description?: string;
};

function boardsPath(slug: string) {
  return `/dashboard/${slug}/boards`;
}

export async function createBoard(
  _previous: BoardFormState,
  formData: FormData,
): Promise<BoardFormState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "board:manage");

  const checked = checkBoardInput(formData.get("name"), formData.get("description"));
  if ("error" in checked) {
    return {
      error: checked.error,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    };
  }

  // One query finds every slug that could clash ("bugs", "bugs-2", ...).
  const base = slugify(checked.name).slice(0, 40);
  const existing = await db
    .select({ slug: boards.slug })
    .from(boards)
    .where(
      and(
        eq(boards.organizationId, organization.id),
        or(eq(boards.slug, base), like(boards.slug, `${base}-%`)),
      ),
    );

  await db.insert(boards).values({
    organizationId: organization.id,
    name: checked.name,
    slug: uniqueSlug(
      base,
      existing.map((row) => row.slug),
    ),
    description: checked.description || null,
  });
  revalidatePath(boardsPath(slug));
  return { saved: true };
}

// The slug is kept when a board is renamed, so links people already shared keep working.
export async function updateBoard(
  _previous: BoardFormState,
  formData: FormData,
): Promise<BoardFormState> {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "board:manage");

  const checked = checkBoardInput(formData.get("name"), formData.get("description"));
  if ("error" in checked) {
    return { error: checked.error };
  }

  await db
    .update(boards)
    .set({ name: checked.name, description: checked.description || null })
    .where(
      and(
        eq(boards.id, String(formData.get("boardId"))),
        eq(boards.organizationId, organization.id),
      ),
    );
  revalidatePath(boardsPath(slug));
  return { saved: true };
}

// Deletes the board with all its posts, votes and comments (database cascade).
export async function deleteBoard(formData: FormData) {
  const slug = String(formData.get("slug"));
  const { organization } = await requirePermission(slug, "board:manage");

  await db
    .delete(boards)
    .where(
      and(
        eq(boards.id, String(formData.get("boardId"))),
        eq(boards.organizationId, organization.id),
      ),
    );
  revalidatePath(boardsPath(slug));
}
