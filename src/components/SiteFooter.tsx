import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="display text-2xl">Safe Rent</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Pilot for Kerem, ahead of brokerage practice. Personal data stays on this machine.
            Government filing stays with a person.
          </p>
        </div>
        <div className="flex gap-5 text-sm">
          <Link href="/agent" className="text-muted hover:text-ink">
            Agent
          </Link>
          <Link href="/broker" className="text-muted hover:text-ink">
            Broker desk
          </Link>
        </div>
      </div>
    </footer>
  );
}
