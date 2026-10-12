import { clientIp } from "@/lib/client-ip";
import { rateLimit } from "@/lib/rate-limit";

// The public search endpoints (widget list, similar ideas) run text searches, so each visitor
// gets a generous limit per workspace: enough for typing, not for hammering the database.
export async function withinSearchLimit(request: Request, organizationSlug: string) {
  const ip = clientIp(request.headers);
  return (await rateLimit(`search:${organizationSlug}:${ip}`, 120, 60)).allowed;
}
