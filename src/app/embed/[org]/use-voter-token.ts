"use client";

import { useEffect, useState } from "react";
import { newBrowserVoterToken } from "@/lib/embed";
import { isVoterToken } from "@/lib/voter-token-format";

// The widget's voter token, kept in its own storage. Inside another website, browsers give the
// widget separate storage per website, so a visitor is the same voter every time they come back
// to that site. If storage is blocked, the token lasts until the page closes.
export function useVoterToken(organizationSlug: string) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const key = `voter-token:${organizationSlug}`;
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(key);
    } catch {
      // Storage blocked (private mode or strict privacy settings).
    }
    if (isVoterToken(saved)) {
      setToken(saved);
      return;
    }
    const fresh = newBrowserVoterToken();
    try {
      window.localStorage.setItem(key, fresh);
    } catch {
      // Same as above: keep it in memory only.
    }
    setToken(fresh);
  }, [organizationSlug]);

  return token;
}
