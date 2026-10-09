"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";

type Organization = { name: string; slug: string };

type NavProps = {
  slug: string;
  organizations: Organization[];
  onNavigate?: () => void;
};

function NavContent({ slug, organizations, onNavigate }: NavProps) {
  const pathname = usePathname();
  const base = `/dashboard/${slug}`;
  const navItems = [
    { label: "Overview", href: base },
    { label: "Feedback", href: `${base}/feedback` },
    { label: "Changelog", href: `${base}/changelog` },
    { label: "Boards", href: `${base}/boards` },
    { label: "Widget", href: `${base}/widget` },
    { label: "Branding", href: `${base}/branding` },
    { label: "Members", href: `${base}/members` },
    { label: "Billing", href: `${base}/billing` },
    { label: "Settings", href: `${base}/settings` },
    { label: "Account", href: `${base}/account` },
  ];

  return (
    <>
      <Logo href={base} onClick={onNavigate} className="block px-2 mb-8" />

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const active = item.href === base ? pathname === base : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`px-2 py-2 rounded-md text-sm ${
                active
                  ? "bg-accent font-medium text-foreground"
                  : "text-secondary-foreground hover:bg-accent"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <a
        href={`/p/${slug}`}
        target="_blank"
        rel="noopener"
        className="mt-4 px-2 py-2 text-sm text-link hover:underline"
      >
        Open public portal ↗
      </a>

      <div className="mt-auto pt-6">
        <p className="px-2 mb-2 text-xs font-semibold uppercase text-subtle-foreground">
          Your organizations
        </p>
        {organizations.map((org) => (
          <Link
            key={org.slug}
            href={`/dashboard/${org.slug}`}
            onClick={onNavigate}
            className={`block px-2 py-1.5 rounded-md text-sm hover:bg-accent ${
              org.slug === slug ? "font-semibold text-foreground" : "text-muted-foreground"
            }`}
          >
            {org.name}
          </Link>
        ))}
        <Link
          href="/onboarding"
          onClick={onNavigate}
          className="block px-2 py-1.5 text-sm text-link hover:underline"
        >
          + New organization
        </Link>
      </div>
    </>
  );
}

export function DesktopSidebar(props: NavProps) {
  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface p-4 hidden md:flex md:flex-col">
      <NavContent {...props} />
    </aside>
  );
}

export function MobileMenu(props: NavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="-ml-2 p-2 text-muted-foreground hover:text-foreground"
      >
        <svg
          aria-hidden="true"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/40"
          />
          <div className="absolute inset-y-0 left-0 w-64 bg-surface p-4 flex flex-col shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-3 p-2 text-subtle-foreground hover:text-foreground"
            >
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <NavContent {...props} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
