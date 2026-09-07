import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Building2,
  CalendarClock,
  ChartPie,
  ClipboardList,
  Contact,
  CreditCard,
  FileSignature,
  FileText,
  Handshake,
  HardHat,
  Home,
  IndianRupee,
  KanbanSquare,
  LayoutGrid,
  Menu,
  Moon,
  Percent,
  Receipt,
  Search,
  Settings,
  Sun,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Home };

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: Home }],
  },
  {
    title: "CRM",
    items: [
      { to: "/leads", label: "Leads", icon: Contact },
      { to: "/leads/kanban", label: "Sales Pipeline", icon: KanbanSquare },
      { to: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
      { to: "/site-visits", label: "Site Visits", icon: ClipboardList },
      { to: "/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Projects & Inventory",
    items: [
      { to: "/projects", label: "Projects", icon: Building2 },
      { to: "/inventory", label: "Unit Inventory", icon: LayoutGrid },
      { to: "/construction", label: "Construction", icon: HardHat },
    ],
  },
  {
    title: "Sales",
    items: [
      { to: "/bookings", label: "Bookings", icon: FileText },
      { to: "/agreements", label: "Agreements", icon: FileSignature },
      { to: "/payment-plans", label: "Payment Plans", icon: ClipboardList },
    ],
  },
  {
    title: "Finance",
    items: [
      { to: "/invoices", label: "Demands & Invoices", icon: Receipt },
      { to: "/payments", label: "Payments", icon: CreditCard },
      { to: "/collections", label: "Collections", icon: Wallet },
    ],
  },
  {
    title: "Partners",
    items: [
      { to: "/partners", label: "Channel Partners", icon: Handshake },
      { to: "/commissions", label: "Commissions", icon: Percent },
    ],
  },
  {
    title: "Insights",
    items: [
      { to: "/documents", label: "Documents", icon: FileText },
      { to: "/reports", label: "Reports", icon: ChartPie },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-4">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 px-2 py-1 text-sidebar-foreground"
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <IndianRupee className="size-4.5" />
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-semibold tracking-tight">Aarambh Estates</span>
          <span className="block text-[11px] text-sidebar-foreground/60">Builder ERP Suite</span>
        </span>
      </Link>

      {NAV_SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-widest text-sidebar-foreground/45 uppercase">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                item.to === "/" ? pathname === "/" : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="mt-auto rounded-lg bg-sidebar-accent/50 p-3 text-xs text-sidebar-foreground/70">
        Demo workspace — data resets on reload.
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const allItems = useMemo(() => NAV_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.title }))), []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-sidebar lg:block">
        <SidebarNav />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 border-none bg-sidebar p-0">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="flex h-9 flex-1 max-w-sm items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-ring/50"
          >
            <Search className="size-4" />
            <span>Search modules…</span>
            <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setDark((d) => !d)}>
              {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="size-4.5" />
            </Button>
            <div className="ml-1 flex items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                RA
              </span>
              <span className="hidden text-xs leading-tight sm:block">
                <span className="block font-medium text-foreground">Rohit Agarwal</span>
                <span className="block text-muted-foreground">Super Admin</span>
              </span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput placeholder="Jump to a module…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {NAV_SECTIONS.map((section) => (
            <CommandGroup key={section.title} heading={section.title}>
              {allItems
                .filter((i) => i.section === section.title)
                .map((item) => (
                  <CommandItem
                    key={item.to}
                    value={`${item.label} ${item.section}`}
                    onSelect={() => {
                      setCmdOpen(false);
                      navigate({ to: item.to });
                    }}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
