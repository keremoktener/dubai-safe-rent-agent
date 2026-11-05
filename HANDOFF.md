# HANDOFF — Dubai Safe Rent Agent

Handover from Sam · Yazılımcı to Sam · SWE (5 Nov 2026). Owner: Kerem Öktener (GitHub: keremoktener). Talk to Kerem in Turkish.

## About Kerem
- Former software developer. He moves to Dubai on 6 Nov 2026 to work as a real estate broker at MGT Grand Real Estate, whose office is in Al Barsha.
- He is personally looking for a furnished 1BR in JVC at 6,000–7,000 AED per month, ideally in a newer building with a gym. That makes him pilot user #1.
- He cares a lot about polished frontend design. His reference is https://www.details.so/inspo (the full library is paywalled, so use it for inspiration only). His view: backend has been strong, frontend needs to keep getting better.

## Why this project exists
It is an entry for the Create AI Agents Championship run by the Dubai Chamber of Digital Economy (launched 7 Oct 2026). The official page is https://dubaichamberdigital.com/en/create-ai-agents.
- **Categories:** Societal, Personal, Business and Youth. We are entering **Business**.
- **Prizes:** USD 150k (AED 550k) for each category winner, plus AED 1M for AI Agent of the Year.
- **Timeline:** Registration closes in Jan 2027. A prototype, an English pitch deck and a demo video are due at the same time. The semi-final is in March 2027. The final is in the first week of May 2027 and needs a fully working agent.
- **Language:** submissions must be in English.
- **What past winners have in common:** they solve a UAE-specific problem, show measurable outcomes and have a B2B model. For example, Takeem (proptech) won Best Advanced App in 2024.

## The problem we solve
People renting or buying in Dubai pay large sums without knowing whether a listing is real or what the process looks like. They run into fake or unpermitted listings, unlicensed agents, and "pay deposit before viewing" scams. On top of that, the contract, Ejari, DEWA and post-dated cheque steps are fragmented.

The agent handles this in two stages:
1. Before any payment, it verifies the listing permit (Trakheesi), the broker's RERA licence, the price against the market, and fraud red flags.
2. It then guides the deal end to end: viewing checklist, offer, contract, Ejari pack, DEWA and the cheque schedule.

The business model is free for end users and a subscription for brokerages.

## Current state
- **Repo:** https://github.com/keremoktener/dubai-safe-rent-agent (public). PR #1 from branch `cursor/dubai-safe-rent-mvp-7b20` is **merged into main**.
- **Stack:** Next.js and TypeScript. The LLM layer is provider-agnostic, and a deterministic mock mode runs without an API key.
- **How to run:** `npm install && npm run dev`, then open localhost:3000. `npm test` runs 21 tests covering the trust score and the cheque schedule.
- **Features:**
  - JVC search with trust scoring. The demo shows Court Eight at 100/Trusted and a social-only scam listing at 0/Avoid ("Do not pay").
  - A guided deal flow.
  - A broker desk.
  - A README with a mermaid architecture diagram.
- `src/lib/adapters` is the place to plug in real data sources.
- **Important:** listings, permit numbers and market prices are all **sample data**, and they are labelled that way. Kerem cannot use the app on real listings yet.

## What we learned about data access
- Ejari and DEWA have no public API. The agent prepares the packs, and a human submits them.
- The DLD Trakheesi API is probably available only to licensed entities. Kerem's brokerage may be able to get access.
- Dubai Pulse Ejari and sales datasets are available on application.
- Because of these limits, the MVP focuses on rentals.
- The design must follow UAE PDPL data protection rules.

## Next steps (proposed to Kerem)
1. **Real use (top priority, already offered to Kerem).** Let Kerem paste a listing link or text. The agent pulls out the permit number, broker details and price, then checks them against DLD's public verification pages and open rent data. That would let him use it in his own JVC search and with his first clients.
2. Apply for Dubai Pulse access and look into Trakheesi access through MGT Grand Real Estate.
3. Connect a real LLM, add Arabic and Turkish UI, and deploy a live demo URL.
4. Prepare the Jan 2027 submission: an English pitch deck and a 2–3 minute demo video.

## Working agreements
- Coding work is done by cloud agents on the repo through branches and PRs, and Kerem merges them.
- Never present sample data as real.
- Share screenshots or video of UI changes so Kerem can review the design.
