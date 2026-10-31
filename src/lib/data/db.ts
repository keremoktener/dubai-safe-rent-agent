import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import type { ChequeSchedule, DealCheck, DealDocument, DealRecord, ListingCardModel } from "@/lib/domain";

const globalForDb = globalThis as unknown as { __safeRentDb?: DatabaseSync };

function database(): DatabaseSync {
  if (!globalForDb.__safeRentDb) {
    const dir = path.join(process.cwd(), "data");
    fs.mkdirSync(dir, { recursive: true });
    const db = new DatabaseSync(path.join(dir, "safe-rent.db"));
    db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS deals (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        renter_label TEXT NOT NULL,
        listing_id TEXT NOT NULL,
        listing_json TEXT NOT NULL,
        checks_json TEXT NOT NULL,
        documents_json TEXT NOT NULL,
        schedule_json TEXT NOT NULL
      );
    `);
    globalForDb.__safeRentDb = db;
  }
  return globalForDb.__safeRentDb;
}

interface DealRow {
  id: string;
  created_at: string;
  updated_at: string;
  renter_label: string;
  listing_id: string;
  listing_json: string;
  checks_json: string;
  documents_json: string;
  schedule_json: string;
}

function stageOrder(checks: DealCheck[]): string[] {
  const ids: string[] = [];
  for (const check of checks) {
    if (!ids.includes(check.stageId)) ids.push(check.stageId);
  }
  return ids;
}

function hydrate(row: DealRow): DealRecord {
  const checks = JSON.parse(row.checks_json) as DealCheck[];
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    renterLabel: row.renter_label,
    listingId: row.listing_id,
    listing: JSON.parse(row.listing_json) as ListingCardModel,
    stageOrder: stageOrder(checks),
    checks,
    documents: JSON.parse(row.documents_json) as DealDocument[],
    schedule: JSON.parse(row.schedule_json) as ChequeSchedule,
  };
}

export function insertDeal(record: Omit<DealRecord, "stageOrder">): DealRecord {
  database()
    .prepare(
      `INSERT INTO deals (
        id, created_at, updated_at, renter_label, listing_id, listing_json, checks_json, documents_json, schedule_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      record.id,
      record.createdAt,
      record.updatedAt,
      record.renterLabel,
      record.listingId,
      JSON.stringify(record.listing),
      JSON.stringify(record.checks),
      JSON.stringify(record.documents),
      JSON.stringify(record.schedule),
    );
  return { ...record, stageOrder: stageOrder(record.checks) };
}

export function listDeals(): DealRecord[] {
  const rows = database()
    .prepare("SELECT * FROM deals ORDER BY updated_at DESC")
    .all() as unknown as DealRow[];
  return rows.map(hydrate);
}

export function getDeal(id: string): DealRecord | null {
  const row = database().prepare("SELECT * FROM deals WHERE id = ?").get(id) as DealRow | undefined;
  return row ? hydrate(row) : null;
}

export function saveDeal(record: DealRecord): DealRecord {
  database()
    .prepare(
      `UPDATE deals
       SET updated_at = ?, renter_label = ?, checks_json = ?, documents_json = ?, schedule_json = ?
       WHERE id = ?`,
    )
    .run(
      record.updatedAt,
      record.renterLabel,
      JSON.stringify(record.checks),
      JSON.stringify(record.documents),
      JSON.stringify(record.schedule),
      record.id,
    );
  return record;
}
