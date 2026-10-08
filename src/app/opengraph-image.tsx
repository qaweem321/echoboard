import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

// The preview image shown when a link to this site is shared (Slack, X, LinkedIn...).
export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 96,
        background: "#030712",
        color: "#f9fafb",
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700 }}>{siteConfig.name}</div>
      <div style={{ marginTop: 24, fontSize: 44, color: "#60a5fa" }}>{siteConfig.tagline}</div>
      <div style={{ marginTop: 40, fontSize: 32, color: "#9ca3af" }}>{siteConfig.description}</div>
    </div>,
    size,
  );
}
