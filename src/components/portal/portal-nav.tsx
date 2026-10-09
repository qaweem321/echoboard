"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

// base: "/p/acme" on the app's domain, "" on the workspace's own domain.
type Props = { base: string };

// The portal's tabs. Feedback stays selected on idea pages (/posts/...).
export function PortalNav({ base }: Props) {
  const pathname = usePathname();
  const home = base || "/";
  const items = [
    {
      label: "Feedback",
      href: home,
      active: pathname === home || pathname.startsWith(`${base}/posts/`),
    },
    { label: "Roadmap", href: `${base}/roadmap`, active: pathname.startsWith(`${base}/roadmap`) },
    {
      label: "Changelog",
      href: `${base}/changelog`,
      active: pathname.startsWith(`${base}/changelog`),
    },
  ];

  return (
    <nav aria-label="Portal" className="flex gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm",
            item.active
              ? "bg-accent font-medium text-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
