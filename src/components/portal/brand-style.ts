import type { CSSProperties } from "react";
import { readableTextColor } from "@/lib/branding";

// Swaps the primary color (buttons, votes, selected tabs) for the workspace's brand color,
// with text that stays readable on it. No brand color: the app's default.
export function brandStyle(brandColor: string | null): CSSProperties | undefined {
  if (!brandColor) {
    return undefined;
  }
  return {
    "--primary": brandColor,
    "--primary-foreground": readableTextColor(brandColor),
  } as CSSProperties;
}
