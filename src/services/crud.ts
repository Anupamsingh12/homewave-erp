import type { Database } from "@/mocks/seed";
import { ApiError, applyQuery, getDb, nextCode, nextId, nowIso, request } from "./api/client";
import type { ListQuery, ListResult } from "@/types";

type Row<K extends keyof Database> = Database[K][number];

export interface CrudService<T> {
  list(query?: ListQuery): Promise<ListResult<T>>;
  all(): Promise<T[]>;
  getById(id: string): Promise<T>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface CrudOptions<K extends keyof Database> {
  idPrefix: string;
  searchFields: (keyof Row<K>)[];
  codePrefix?: string;
  codeStart?: number;
  /** Throw an ApiError to block deletion (relationship safety). */
  guardDelete?: (row: Row<K>, db: Database) => string | null;
  beforeCreate?: (draft: Row<K>, db: Database) => void;
  afterMutate?: (row: Row<K>, db: Database) => void;
}

export function createCrudService<K extends keyof Database>(
  key: K,
  options: CrudOptions<K>,
): CrudService<Row<K>> {
  const rows = () => getDb()[key] as Row<K>[];

  return {
    list(query) {
      return request(`/${String(key)}`, () =>
        applyQuery(
          rows() as unknown as Record<string, unknown>[],
          query,
          options.searchFields as string[],
        ) as unknown as ListResult<Row<K>>,
      );
    },
    all() {
      return request(`/${String(key)}/all`, () => [...rows()]);
    },
    getById(id) {
      return request(`/${String(key)}/${id}`, () => {
        const found = rows().find((r) => (r as { id: string }).id === id);
        if (!found) throw new ApiError("Record not found", 404);
        return found;
      });
    },
    create(data) {
      return request(`/${String(key)}`, () => {
        const db = getDb();
        const list = rows();
        const draft = {
          ...(data as object),
          id: nextId(options.idPrefix),
          code:
            (data as { code?: string }).code ??
            (options.codePrefix
              ? nextCode(options.codePrefix, list as { code: string }[], options.codeStart ?? 1001)
              : undefined),
          createdAt: nowIso(),
          updatedAt: nowIso(),
        } as Row<K>;
        options.beforeCreate?.(draft, db);
        list.unshift(draft);
        options.afterMutate?.(draft, db);
        return draft;
      });
    },
    update(id, data) {
      return request(`/${String(key)}/${id}`, () => {
        const db = getDb();
        const list = rows();
        const idx = list.findIndex((r) => (r as { id: string }).id === id);
        if (idx === -1) throw new ApiError("Record not found", 404);
        const next = { ...list[idx], ...data, id, updatedAt: nowIso() } as Row<K>;
        list[idx] = next;
        options.afterMutate?.(next, db);
        return next;
      });
    },
    remove(id) {
      return request(`/${String(key)}/${id}`, () => {
        const db = getDb();
        const list = rows();
        const idx = list.findIndex((r) => (r as { id: string }).id === id);
        if (idx === -1) throw new ApiError("Record not found", 404);
        const blocked = options.guardDelete?.(list[idx], db);
        if (blocked) throw new ApiError(blocked, 409);
        list.splice(idx, 1);
      });
    },
  };
}

export function logActivity(
  entityKind: Database["activities"][number]["entityKind"],
  entityId: string,
  title: string,
  description: string,
) {
  const db = getDb();
  db.activities.unshift({
    id: nextId("act"),
    entityKind,
    entityId,
    at: nowIso(),
    title,
    description,
    actorId: db.users[0].id,
  });
}
