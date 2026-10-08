import { unsubscribeVoter } from "@/lib/notifications/unsubscribe";

// One-click unsubscribe (RFC 8058): mail apps POST here when someone presses their built-in
// "Unsubscribe" button. People clicking the link in the email use the /unsubscribe page.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const ok = await unsubscribeVoter(url.searchParams.get("v"), url.searchParams.get("t"));
  return new Response(null, { status: ok ? 200 : 400 });
}
