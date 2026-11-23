"use client";

import { useCan } from "@mono/auth/react";
import { useIsMobile } from "@mono/hooks";
import { useModalToggle } from "@mono/hooks/next";
import {
  CardSummary,
  DataTable,
  MobileCardList,
  MobileDataCard,
  PageHeader,
  StatusLabel,
  type TableColumn,
  TableEmptyState,
} from "@mono/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { formatProjectDate } from "../helpers/format-date";
import { useProjects } from "../hooks/use-projects";
import {
  HEALTH_TONE,
  PROJECT_HEALTH_LABEL,
  PROJECT_STATUS_LABEL,
  type ProjectHealth,
  type ProjectListItem,
  type ProjectStatus,
  projectHealthSchema,
  projectStatusSchema,
} from "../schema";
import { ProjectFilters, type ProjectFilterValues } from "./project-filters";
import { ProjectFormModal } from "./project-form-modal";
import { ProjectListSkeleton } from "./project-list-skeleton";
import { ProjectProgress } from "./project-progress";
import { ProjectSummaryTiles } from "./project-summary-tiles";

const PAGE_SIZE = 10;

function ProjectLink({ project }: { project: ProjectListItem }) {
  return (
    <Link href={`/projects/${project.id}`} className="min-w-0 hover:underline">
      <span className="min-w-0 font-medium break-words text-foreground">{project.name}</span>
    </Link>
  );
}

function Health({ health }: { health: ProjectHealth }) {
  return <StatusLabel tone={HEALTH_TONE[health]}>{PROJECT_HEALTH_LABEL[health]}</StatusLabel>;
}

function TargetDate({ project }: { project: ProjectListItem }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      {formatProjectDate(project.target_date)}
      {project.is_overdue && <StatusLabel tone="danger">Terlambat</StatusLabel>}
    </span>
  );
}

const COLUMNS: TableColumn<ProjectListItem>[] = [
  { id: "code", header: "Kode", cell: (p) => <span className="font-mono text-xs">{p.code}</span> },
  { id: "name", header: "Nama", minWidth: 200, cell: (p) => <ProjectLink project={p} /> },
  { id: "health", header: "Kesehatan", cell: (p) => <Health health={p.health} /> },
  { id: "status", header: "Status", cell: (p) => PROJECT_STATUS_LABEL[p.status] },
  {
    id: "progress",
    header: "Progres",
    minWidth: 160,
    cell: (p) => <ProjectProgress value={p.progress} />,
  },
  { id: "target_date", header: "Target", cell: (p) => <TargetDate project={p} /> },
];

function parseFilters(params: URLSearchParams) {
  const page = Number(params.get("page"));
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    search: params.get("search") ?? "",
    status: projectStatusSchema.safeParse(params.get("status")).data as ProjectStatus | undefined,
    health: projectHealthSchema.safeParse(params.get("health")).data as ProjectHealth | undefined,
  };
}

/** Writes filters/page to the URL without a navigation, keeping unrelated params (`modal`, …). */
function writeParams(patch: Record<string, string | number | undefined>) {
  const next = new URLSearchParams(window.location.search);
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === "") next.delete(key);
    else next.set(key, String(value));
  }
  const query = next.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

export function ProjectsPage() {
  const isMobile = useIsMobile();
  const canManage = useCan("project:manage");
  const [, setFormOpen] = useModalToggle("project-form");
  const { page, search, status, health } = parseFilters(useSearchParams());

  const { data, isLoading, isError } = useProjects({
    page,
    page_size: PAGE_SIZE,
    ...(search && { search }),
    ...(status && { status }),
    ...(health && { health }),
  });
  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const onFilterChange = (patch: Partial<ProjectFilterValues>) =>
    writeParams({ ...patch, page: undefined });

  let body: React.ReactNode;
  if (isLoading) {
    body = <ProjectListSkeleton rows={PAGE_SIZE} />;
  } else if (isError) {
    body = <TableEmptyState message="Gagal memuat project" />;
  } else if (items.length === 0) {
    body = <TableEmptyState message="Belum ada project" />;
  } else if (isMobile) {
    body = (
      <MobileCardList
        items={items}
        keyOf={(p) => p.id}
        renderCard={(p) => (
          <MobileDataCard
            collapsible={false}
            header={
              <CardSummary
                title={<ProjectLink project={p} />}
                subtitle={<span className="break-words">{p.code}</span>}
              />
            }
            rows={[
              { label: "Kesehatan", value: <Health health={p.health} /> },
              { label: "Status", value: PROJECT_STATUS_LABEL[p.status] },
              { label: "Progres", value: <ProjectProgress value={p.progress} /> },
              { label: "Target", value: <TargetDate project={p} /> },
            ]}
          />
        )}
        pagination={{
          total,
          page,
          pageSize: PAGE_SIZE,
          onChange: (next) => writeParams({ page: next }),
        }}
      />
    );
  } else {
    body = (
      <DataTable
        columns={COLUMNS}
        data={items}
        pagination={{
          total,
          current: page,
          pageSize: PAGE_SIZE,
          onChange: (next) => writeParams({ page: next }),
        }}
      />
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <PageHeader
        title="Project"
        subtitle="Pantau kesehatan dan progres project Anda"
        linkComponent={Link}
        actions={[
          {
            label: "Project Baru",
            icon: <Plus className="size-4" />,
            hidden: !canManage,
            onClick: () => setFormOpen(true),
            testId: "project-add",
          },
        ]}
      />
      <ProjectSummaryTiles />
      <ProjectFilters values={{ search, status, health }} onChange={onFilterChange} />
      {body}
      {canManage && <ProjectFormModal mode="create" />}
    </div>
  );
}
