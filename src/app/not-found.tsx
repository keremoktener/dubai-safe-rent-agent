import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <p className="eyebrow">Missing</p>
      <h1 className="display mt-4 text-5xl">That file is not on this machine.</h1>
      <p className="mt-4 text-muted">Deals stay in the local database. A link from another computer will not resolve.</p>
      <Link href="/agent" className="btn btn-primary mt-8">
        Back to the agent
      </Link>
    </div>
  );
}
