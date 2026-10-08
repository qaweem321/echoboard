"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

type Props = { items: { label: string; href: string }[] };

// The portal's tabs (Feedback, Roadmap, ...). The first item is the portal home.
export function PortalNav({ items }: Props) {
  const pathname = usePathname();
  const home = items[0]?.href;

  return (
    <nav aria-label="Portal" className="flex gap-1">
      {items.map((item) => {
        const active =
          item.href === home
            ? pathname === home || pathname.startsWith(`${home}/posts`)
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              active
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
