import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card shadow-card", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div>
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function FieldList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((i) => (
        <div key={i.label}>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {i.label}
          </dt>
          <dd className="mt-1 text-sm text-foreground">{i.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
