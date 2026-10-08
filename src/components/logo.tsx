import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

type LogoProps = { href?: string; className?: string; onClick?: () => void };

// Swap the text for an <Image> here to use your own logo everywhere.
// Inside the app it links to the dashboard; on public pages it links to the landing page.
export function Logo({ href = "/", className, onClick }: LogoProps) {
  return (
    <Link href={href} onClick={onClick} className={cn("text-lg font-bold", className)}>
      {siteConfig.name}
    </Link>
  );
}
