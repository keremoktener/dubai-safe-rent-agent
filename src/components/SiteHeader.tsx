"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mark } from "@/components/Mark";

const links = [
  { href: "/agent", label: "Agent" },
  { href: "/broker", label: "Desk" },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-sand/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex items-center gap-3 text-ink">
          <Mark />
          <span>
            <span className="block text-[0.65rem] tracking-[0.18em] text-muted uppercase">Dubai</span>
            <span className="display block text-[1.35rem] leading-none">Safe Rent</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2 sm:gap-6">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-2 text-sm ${active ? "bg-sand-2 text-ink" : "text-muted hover:text-ink"}`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link href="/agent" className="btn btn-primary ms-1 px-4 py-2 text-sm">
            Run a search
          </Link>
        </nav>
      </div>
    </header>
  );
}
