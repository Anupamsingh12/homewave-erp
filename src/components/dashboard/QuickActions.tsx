import { useNavigate } from "@tanstack/react-router";
import { CalendarClock, ClipboardList, Contact, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { label: "Add Lead", icon: UserPlus, to: "/leads" as const },
    { label: "Add Customer", icon: Contact, to: "/customers" as const },
    { label: "Schedule Site Visit", icon: CalendarClock, to: "/site-visits" as const },
    { label: "Add Follow-up", icon: ClipboardList, to: "/follow-ups" as const },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button key={a.label} variant="outline" onClick={() => navigate({ to: a.to })}>
          <a.icon className="size-4" /> {a.label}
        </Button>
      ))}
    </div>
  );
}
