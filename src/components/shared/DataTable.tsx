import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { downloadCsv, titleize } from "@/lib/format";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  value?: (row: T) => string | number;
  sortable?: boolean;
  className?: string;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: string[];
  match: (row: T, value: string) => boolean;
  optionLabel?: (value: string) => string;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading,
  searchFields,
  filters,
  onRowClick,
  toolbar,
  exportName,
  pageSize = 10,
  emptyTitle,
  emptyDescription,
}: {
  rows: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchFields?: (keyof T)[];
  filters?: FilterDef<T>[];
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  exportName?: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [active, setActive] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let out = [...rows];
    const term = search.trim().toLowerCase();
    if (term && searchFields?.length) {
      out = out.filter((r) =>
        searchFields.some((f) =>
          String(r[f] ?? "")
            .toLowerCase()
            .includes(term),
        ),
      );
    }
    for (const f of filters ?? []) {
      const v = active[f.key];
      if (v && v !== "ALL") out = out.filter((r) => f.match(r, v));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      const dir = sort.dir === "asc" ? 1 : -1;
      out.sort((a, b) => {
        const av = col?.value ? col.value(a) : (a as Record<string, unknown>)[sort.key];
        const bv = col?.value ? col.value(b) : (b as Record<string, unknown>)[sort.key];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
        return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
      });
    }
    return out;
  }, [rows, search, filters, active, sort, columns, searchFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchFields?.length ? (
          <div className="relative min-w-56 flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search…"
              className="pl-9"
            />
          </div>
        ) : null}
        {(filters ?? []).map((f) => (
          <Select
            key={f.key}
            value={active[f.key] ?? "ALL"}
            onValueChange={(v) => {
              setActive((a) => ({ ...a, [f.key]: v }));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[168px]">
              <SelectValue placeholder={f.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All {f.label}</SelectItem>
              {f.options.map((o) => (
                <SelectItem key={o} value={o}>
                  {f.optionLabel ? f.optionLabel(o) : titleize(o)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {toolbar}
          {exportName && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(
                  `${exportName}.csv`,
                  filtered.map((r) =>
                    Object.fromEntries(
                      columns.map((c) => [
                        c.header,
                        c.value ? c.value(r) : String((r as Record<string, unknown>)[c.key] ?? ""),
                      ]),
                    ),
                  ),
                )
              }
            >
              <Download className="size-4" /> Export
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={cn(
                      "px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase",
                      c.className,
                    )}
                  >
                    {c.sortable === false ? (
                      c.header
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() =>
                          setSort((s) =>
                            s?.key === c.key
                              ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" }
                              : { key: c.key, dir: "asc" },
                          )
                        }
                      >
                        {c.header}
                        <ArrowUpDown className="size-3" />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      {columns.map((c) => (
                        <td key={c.key} className="px-4 py-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                : visible.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick?.(row)}
                      className={cn(
                        "border-t border-border transition-colors",
                        onRowClick && "cursor-pointer hover:bg-muted/40",
                      )}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                          {c.render
                            ? c.render(row)
                            : String((row as Record<string, unknown>)[c.key] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
        {!loading && !visible.length && (
          <div className="p-4">
            <EmptyState
              title={emptyTitle ?? "No records found"}
              {...(emptyDescription ? { description: emptyDescription } : {})}
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length ? (current - 1) * pageSize + 1 : 0}–
          {Math.min(current * pageSize, filtered.length)} of {filtered.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </Button>
          <span className="tabular-nums">
            Page {current} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current >= totalPages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
