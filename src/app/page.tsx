import { HomeView } from "@/components/HomeView";
import { buildSearchRun } from "@/lib/agent/search-run";
import { JVC_BRIEF } from "@/lib/demo";

export default function HomePage() {
  const run = buildSearchRun(JVC_BRIEF);
  const lead = run.listings.find((listing) => listing.id === "lst_jvc_court") ?? run.listings[0];
  const risk = run.listings.find((listing) => listing.id === "lst_jvc_direct");
  if (!lead) {
    return (
      <p className="mx-auto max-w-6xl px-6 py-20">
        The sample registry did not return a home for the pilot brief.
      </p>
    );
  }
  return <HomeView lead={lead} risk={risk} />;
}
