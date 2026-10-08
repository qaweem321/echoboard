import { ilike, or } from "drizzle-orm";
import { posts } from "@/db/schema";
import { escapeLike } from "@/lib/feedback-input";

// Matches posts whose title or details contain the search text (any case).
// Used by the public portal and the team's inbox.
export function postSearchFilter(q: string) {
  if (!q) {
    return undefined;
  }
  const pattern = `%${escapeLike(q)}%`;
  return or(ilike(posts.title, pattern), ilike(posts.body, pattern));
}
