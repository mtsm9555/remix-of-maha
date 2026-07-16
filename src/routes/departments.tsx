import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Users,
  Brain,
  Wrench,
  Target,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  Building2,
  DollarSign,
} from "lucide-react";

import { getDepartmentsSnapshot, type DeptSnapshot } from "@/lib/departments.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/departments")({
  head: () => ({
    meta: [
      { title: "Departments — Maha OS" },
      {
        name: "description",
        content:
          "Live view of every department: manager, memory, tools, KPIs, and workflows.",
      },
    ],
  }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const fetchDepartments = useServerFn(getDepartmentsSnapshot);
  const { data, isLoading, error } = useQuery({
    queryKey: ["departments-snapshot"],
    queryFn: () => fetchDepartments(),
  });

  const departments = data ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => departments.find((d) => d.id === (selectedId ?? departments[0]?.id)) ?? null,
    [departments, selectedId],
  );

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-sm text-muted-foreground">
              Manager · Memory · Tools · KPIs · Workflows across the Maha OS organization.
            </p>
          </div>
        </header>

        {isLoading && (
          <p className="text-sm text-muted-foreground">Loading department registry…</p>
        )}
        {error && (
          <p className="text-sm text-destructive">Failed to load departments: {String(error)}</p>
        )}

        {!isLoading && !error && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <nav className="space-y-2">
              {departments.map((d) => {
                const isActive = selected?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{d.name}</span>
                      <Badge variant="secondary">{d.agents.length}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      ${d.budget.allocated.toLocaleString()} / ${d.budget.limit.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </nav>

            {selected && <DepartmentDetail dept={selected} />}
          </div>
        )}
      </div>
    </main>
  );
}

function DepartmentDetail({ dept }: { dept: DeptSnapshot }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{dept.name}</CardTitle>
              <p className="text-xs text-muted-foreground">id: {dept.id}</p>
            </div>
            <Badge className="gap-1">
              <DollarSign className="h-3 w-3" />
              {dept.budget.spent.toLocaleString()} / {dept.budget.limit.toLocaleString()}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="manager">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="manager">
            <Users className="mr-2 h-4 w-4" />
            Manager
          </TabsTrigger>
          <TabsTrigger value="memory">
            <Brain className="mr-2 h-4 w-4" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="tools">
            <Wrench className="mr-2 h-4 w-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="kpis">
            <Target className="mr-2 h-4 w-4" />
            KPIs
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <GitBranch className="mr-2 h-4 w-4" />
            Workflows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department Manager Agent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <span className="text-muted-foreground">Manager ID:</span>{" "}
                <code className="rounded bg-muted px-1.5 py-0.5">{dept.managerId}</code>
              </div>
              <div>
                <div className="mb-2 text-sm text-muted-foreground">
                  Reports {dept.agents.length} agent{dept.agents.length === 1 ? "" : "s"}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dept.agents.length === 0 && (
                    <span className="text-xs text-muted-foreground">No agents registered.</span>
                  )}
                  {dept.agents.map((a) => (
                    <Badge key={a} variant="outline">
                      {a}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department Memory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{dept.memory.note}</p>
              <ul className="ml-5 list-disc space-y-1">
                <li>Procedural — how the department solves recurring tasks.</li>
                <li>Semantic — durable facts learned from completed milestones.</li>
                <li>Episodic — timestamped records of past executions.</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="mt-4 space-y-3">
          {dept.tools.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No tool permissions registered for this department.
            </p>
          )}
          {dept.tools.map((t) => (
            <Card key={`${t.name}-${t.level}`}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm">{t.name}</code>
                    {t.rateLimit && (
                      <Badge variant="outline" className="text-xs">
                        {t.rateLimit}/hr
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                </div>
                <LevelBadge level={t.level} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="kpis" className="mt-4 grid gap-3 md:grid-cols-2">
          {dept.kpis.map((k) => {
            const pct = k.target > 0 ? Math.min(100, (k.current / k.target) * 100) : 0;
            return (
              <Card key={k.name}>
                <CardContent className="py-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{k.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {k.current} / {k.target} {k.unit}
                    </span>
                  </div>
                  <Progress value={pct} />
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="workflows" className="mt-4 space-y-3">
          {dept.workflows.length === 0 && (
            <p className="text-sm text-muted-foreground">No workflows registered.</p>
          )}
          {dept.workflows.map((w) => (
            <Card key={w.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{w.name}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{w.description}</p>
                  </div>
                  <Badge variant="secondary">{w.steps} steps</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LevelBadge({ level }: { level: string }) {
  if (level === "deny")
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        deny
      </Badge>
    );
  if (level === "require_approval")
    return (
      <Badge className="gap-1 bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30">
        <ShieldCheck className="h-3 w-3" />
        approval
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1">
      <ShieldCheck className="h-3 w-3" />
      allow
    </Badge>
  );
}