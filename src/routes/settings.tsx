import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column, type FilterDef } from "@/components/shared/DataTable";
import { Panel, FieldList } from "@/components/shared/DetailCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { UserFormDialog } from "@/components/settings/UserFormDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAction, useData } from "@/hooks/use-erp";
import { userService } from "@/services";
import { titleize } from "@/lib/format";
import type { User, UserRole } from "@/types";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "SALES_MANAGER",
  "SALES_EXECUTIVE",
  "ACCOUNTS",
  "PROJECT_MANAGER",
];

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ["Full access to every module", "Manage users & roles", "Manage settings"],
  ADMIN: ["Full access to every module", "Manage settings"],
  SALES_MANAGER: ["CRM & Sales", "Bookings & Agreements", "Reports"],
  SALES_EXECUTIVE: ["Leads, Follow-ups & Site Visits", "Create Bookings"],
  ACCOUNTS: ["Invoices, Payments & Collections", "Commissions"],
  PROJECT_MANAGER: ["Projects, Inventory & Construction"],
};

function SettingsPage() {
  const { data: users, isLoading } = useData(["users", "all"], userService.all);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const toggleActive = useAction(
    (input: { id: string; active: boolean }) =>
      userService.update(input.id, { active: input.active }),
    { success: "User updated" },
  );

  const columns: Column<User>[] = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "role", header: "Role", render: (u) => titleize(u.role) },
    {
      key: "active",
      header: "Status",
      render: (u) => <StatusBadge value={u.active ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      render: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="User actions">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditing(u)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleActive.mutate({ id: u.id, active: !u.active })}>
              {u.active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const filters: FilterDef<User>[] = [
    { key: "role", label: "Role", options: ROLES, match: (u, v) => u.role === v },
  ];

  return (
    <div>
      <PageHeader title="Settings" description="Company, user, and role configuration." />

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="company">Company Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <PageHeader
            title="Users"
            description="Everyone with access to this workspace."
            actions={
              <Button onClick={() => setCreating(true)}>
                <Plus className="size-4" /> Add User
              </Button>
            }
          />
          <DataTable
            rows={users ?? []}
            columns={columns}
            loading={isLoading}
            searchFields={["name", "email", "phone"]}
            filters={filters}
            exportName="users"
            emptyTitle="No users yet"
            emptyDescription="Add your team to assign leads, bookings, and approvals."
          />
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2">
            {ROLES.map((role) => (
              <Panel key={role} title={titleize(role)}>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {ROLE_PERMISSIONS[role].map((perm) => (
                    <li key={perm}>{perm}</li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="company">
          <Panel title="Company Profile">
            <FieldList
              items={[
                { label: "Company Name", value: "Buildwell Developers Pvt. Ltd." },
                { label: "Industry", value: "Real Estate Development" },
                { label: "Headquarters", value: "Mumbai, India" },
                { label: "Currency", value: "INR (₹)" },
              ]}
            />
          </Panel>
        </TabsContent>
      </Tabs>

      <UserFormDialog open={creating} onOpenChange={setCreating} />
      <UserFormDialog
        open={Boolean(editing)}
        onOpenChange={(v) => !v && setEditing(null)}
        user={editing ?? undefined}
      />
    </div>
  );
}
