import { buildSeed, type Database } from "@/mocks/seed";
import type { ListQuery, ListResult } from "@/types";

/**
 * Central API client. Today it resolves against an in-memory mock repository.
 * Swapping to a REST backend only requires replacing the internals of
 * `apiClient.request` — no UI or service signature changes.
 */

let db: Database | null = null;

export function getDb(): Database {
  if (!db) db = buildSeed();
  return db;
}

export function resetDb() {
  db = buildSeed();
}

export const LATENCY = 180;

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Simulated network boundary — every service call goes through here. */
export async function request<T>(_path: string, work: () => T): Promise<T> {
  await new Promise((r) => setTimeout(r, LATENCY));
  return work();
}

export function nowIso() {
  return new Date().toISOString();
}

export function nextId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nextCode(prefix: string, existing: { code: string }[], start: number) {
  const nums = existing
    .map((e) => Number(e.code.replace(/\D/g, "")))
    .filter((n) => Number.isFinite(n));
  const next = nums.length ? Math.max(...nums) + 1 : start;
  return `${prefix}${next}`;
}

function getValue(row: Record<string, unknown>, key: string): unknown {
  return row[key];
}

export function applyQuery<T extends Record<string, unknown>>(
  rows: T[],
  query: ListQuery | undefined,
  searchFields: (keyof T)[],
): ListResult<T> {
  let out = [...rows];
  const q = query ?? {};

  if (q.search?.trim()) {
    const term = q.search.trim().toLowerCase();
    out = out.filter((r) =>
      searchFields.some((f) =>
        String(r[f] ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }

  if (q.filters) {
    for (const [key, value] of Object.entries(q.filters)) {
      if (!value || value === "ALL") continue;
      out = out.filter((r) => String(getValue(r, key) ?? "") === value);
    }
  }

  if (q.sortBy) {
    const dir = q.sortDir === "desc" ? -1 : 1;
    out.sort((a, b) => {
      const av = getValue(a, q.sortBy!);
      const bv = getValue(b, q.sortBy!);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
    });
  }

  const total = out.length;
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 10;
  const start = (page - 1) * pageSize;
  return { data: out.slice(start, start + pageSize), total, page, pageSize };
}
