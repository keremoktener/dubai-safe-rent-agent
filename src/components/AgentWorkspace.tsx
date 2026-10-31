"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/ListingCard";
import { JVC_BRIEF, MARINA_BRIEF } from "@/lib/demo";
import type { AgentEvent, AgentResult, AgentStep } from "@/lib/domain";

interface Turn {
  id: string;
  role: "user" | "agent";
  text: string;
  steps: AgentStep[];
  result?: AgentResult;
}

export function AgentWorkspace() {
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState(JVC_BRIEF);
  const [running, setRunning] = useState(false);
  const [llm, setLlm] = useState("mock");
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const openingRef = useRef<string | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then((body: { llm?: string }) => {
        if (body.llm) setLlm(body.llm);
      })
      .catch(() => undefined);
  }, []);

  async function send(message: string) {
    const text = message.trim();
    if (!text || running) return;
    setError(null);
    setRunning(true);
    const userId = crypto.randomUUID();
    const agentId = crypto.randomUUID();
    setTurns((current) => [
      ...current,
      { id: userId, role: "user", text, steps: [] },
      { id: agentId, role: "agent", text: "", steps: [] },
    ]);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!response.ok || !response.body) {
        throw new Error("The agent could not start.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.split("\n").find((item) => item.startsWith("data: "));
          if (!line) continue;
          const event = JSON.parse(line.slice(6)) as AgentEvent;
          applyEvent(agentId, event);
        }
      }
    } catch {
      setError("The agent stopped. The sample registry is still here. Send the brief again.");
    } finally {
      setRunning(false);
    }
  }

  function applyEvent(agentId: string, event: AgentEvent) {
    if (event.type === "error") {
      setError(event.message);
      return;
    }
    setTurns((current) =>
      current.map((turn) => {
        if (turn.id !== agentId) return turn;
        if (event.type === "step") {
          const index = turn.steps.findIndex((step) => step.id === event.step.id);
          const steps = turn.steps.slice();
          if (index === -1) steps.push(event.step);
          else steps[index] = event.step;
          return { ...turn, steps };
        }
        return { ...turn, text: event.result.narrative, result: event.result };
      }),
    );
    if (event.type === "result" && event.result.llm) {
      setLlm(event.result.llm);
    }
  }

  async function openDeal(listingId: string) {
    if (openingRef.current) return;
    openingRef.current = listingId;
    setOpening(listingId);
    setError(null);
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      const body = (await response.json()) as { deal?: { id: string }; error?: string };
      if (!response.ok || !body.deal) {
        throw new Error(body.error ?? "Could not open the file.");
      }
      router.push(`/deals/${body.deal.id}`);
    } catch (cause) {
      openingRef.current = null;
      setOpening(null);
      setError(cause instanceof Error ? cause.message : "Could not open the file.");
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:py-14">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="eyebrow">{llm === "mock" ? "Mock mode" : `Narration · ${llm}`}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {llm === "mock"
            ? "No model is called. The shortlist and the scores are deterministic."
            : "The model may phrase the note. Scores still come from the tools."}
        </p>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li>1. Read the brief</li>
          <li>2. Match the sample registry</li>
          <li>3. Permit and licence</li>
          <li>4. Sample Ejari band</li>
          <li>5. Police fraud patterns</li>
        </ul>
      </aside>

      <div>
        {turns.length === 0 ? (
          <div>
            <h1 className="display text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
              Ask for a home the way you would say it.
            </h1>
            <div className="mt-8 grid gap-3">
              <button
                type="button"
                className="rounded-2xl border border-line bg-paper p-5 text-start hover:border-accent"
                onClick={() => void send(JVC_BRIEF)}
              >
                <span className="eyebrow">Pilot brief</span>
                <span className="display mt-3 block text-2xl leading-snug">{JVC_BRIEF}</span>
              </button>
              <button
                type="button"
                className="rounded-2xl border border-line bg-paper/60 p-5 text-start text-muted hover:border-ink/30 hover:text-ink"
                onClick={() => void send(MARINA_BRIEF)}
              >
                <span className="eyebrow">Another sample</span>
                <span className="mt-2 block text-base">{MARINA_BRIEF}</span>
              </button>
            </div>
          </div>
        ) : (
          <ol className="space-y-12">
            {turns.map((turn) =>
              turn.role === "user" ? (
                <li key={turn.id}>
                  <blockquote className="border-s-2 border-accent ps-4 font-display text-2xl leading-snug sm:text-3xl">
                    {turn.text}
                  </blockquote>
                </li>
              ) : (
                <li key={turn.id}>
                  {turn.steps.length > 0 ? (
                    <ol className="space-y-3" aria-live="polite">
                      {turn.steps.map((step) => (
                        <li key={step.id} className="grid grid-cols-[0.9rem_1fr] gap-3">
                          <span className={`dot ${step.status === "complete" ? "dot-done" : "dot-live"}`} />
                          <div>
                            <p className="text-sm">{step.label}</p>
                            {step.status === "complete" && step.detail ? (
                              <p className="text-sm text-muted">{step.detail}</p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted">Starting the checks…</p>
                  )}
                  {turn.result ? <ResultView result={turn.result} opening={opening} onOpen={openDeal} /> : null}
                </li>
              ),
            )}
          </ol>
        )}

        {error ? (
          <p role="alert" className="mt-6 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <form
          className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
        >
          <label className="sr-only" htmlFor="brief">
            Rental brief
          </label>
          <input
            id="brief"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="min-h-12 flex-1 rounded-full border border-line bg-paper px-5 text-base outline-none"
            placeholder="Furnished 1BR in JVC around 7,000 AED/month"
            maxLength={2000}
          />
          <button type="submit" className="btn btn-primary" disabled={running || draft.trim().length === 0}>
            {running ? "Checking" : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ResultView({
  result,
  opening,
  onOpen,
}: {
  result: AgentResult;
  opening: string | null;
  onOpen: (id: string) => void;
}) {
  const held = result.listings.filter(
    (listing) => listing.trust.band === "avoid" || listing.trust.band === "caution",
  );
  const shortlist = result.listings.filter((listing) => !held.includes(listing));
  return (
    <div className="mt-8">
      <div className="max-w-3xl space-y-4">
        {result.narrative.split("\n\n").map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className="text-lg leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
      {result.guidance ? (
        <div className="mt-6 rounded-2xl border border-line bg-paper p-5">
          <p className="eyebrow">{result.guidance.title}</p>
          <ul className="mt-4 space-y-3">
            {result.guidance.items.map((item) => (
              <li key={item.id}>
                <p>{item.label}</p>
                <p className="text-sm text-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.dealId ? (
        <a href={`/deals/${result.dealId}`} className="btn btn-primary mt-6">
          Open the file
        </a>
      ) : null}
      {result.listings.length > 0 ? (
        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <h2 className="eyebrow">Shortlist</h2>
            {shortlist.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                opening={opening === listing.id}
                onOpen={onOpen}
              />
            ))}
          </div>
          {held.length > 0 ? (
            <aside className="rounded-[1.4rem] bg-[#241c18] p-4 text-[#f6efe9] xl:sticky xl:top-24">
              <p className="px-2 pt-2 text-[0.72rem] tracking-[0.16em] text-[#e7c7c1] uppercase">Do not pay</p>
              <h2 className="display px-2 pt-2 text-3xl">Held back</h2>
              <p className="px-2 pt-2 pb-4 text-sm leading-relaxed text-[#eadfd8]">
                These match the search. Dubai Police have warned about this shape of offer.
              </p>
              <div className="space-y-4">
                {held.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    compact
                    opening={opening === listing.id}
                    onOpen={onOpen}
                  />
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      ) : null}
      <p className="mt-6 text-xs text-muted">
        Sample registry · {result.llm === "mock" ? "deterministic summary, no model call" : `note phrased by ${result.llm}`}
      </p>
    </div>
  );
}
