import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";

// The public searches (portal, widget list, similar ideas) run text searches, so each visitor
// gets a generous limit per workspace: enough for typing, not for hammering the database.
export async function withinSearchLimit(requestHeaders: Headers, organizationSlug: string) {
  const ip = clientIp(requestHeaders);
  return (await rateLimit(`search:${organizationSlug}:${ip}`, 120, 60)).allowed;
}
