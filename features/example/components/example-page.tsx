"use client";

import { useIsMobile } from "@mono/hooks";
import { useModalToggle } from "@mono/hooks/next";
import {
  DataTable,
  MobileCardList,
  MobileDataCard,
  PageHeader,
  StatusLabel,
  type TableColumn,
  TableEmptyState,
  TableSkeleton,
} from "@mono/ui";
import { formatWitaDateTime } from "@mono/utils";
import { Download, Plus } from "lucide-react";
import { useState } from "react";

import { useFeatureFlag } from "@/lib/feature-flags/client";
import { toast } from "@/lib/toast";

import { useExamples } from "../hooks/use-example";
import type { ExampleItem } from "../schema";
import { CreateExampleModal } from "./create-example-modal";

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<ExampleItem["status"], { text: string; tone: "success" | "default" }> = {
  active: { text: "Aktif", tone: "success" },
  inactive: { text: "Nonaktif", tone: "default" },
};

function ExampleStatus({ status }: { status: ExampleItem["status"] }) {
  const { text, tone } = STATUS_LABEL[status];
  return <StatusLabel tone={tone}>{text}</StatusLabel>;
}

const formatDate = (value: string) => formatWitaDateTime(value, "DD MMM YYYY HH:mm");

const COLUMNS: TableColumn<ExampleItem>[] = [
  { id: "name", header: "Nama", cell: (row) => row.name },
  { id: "status", header: "Status", cell: (row) => <ExampleStatus status={row.status} /> },
  { id: "created_at", header: "Dibuat", cell: (row) => formatDate(row.created_at) },
];

/**
 * Reference list page: PageHeader + desktop table / mobile cards, skeleton
 * loading, empty state, a URL-backed modal form and a feature-flagged action.
 */
export function ExamplePage() {
  const [page, setPage] = useState(1);
  const isMobile = useIsMobile();
  const [createOpen, setCreateOpen] = useModalToggle("create-example");
  const canExport = useFeatureFlag("exampleFlag");
  const { data, isLoading } = useExamples({ page, page_size: PAGE_SIZE });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Contoh"
        subtitle="Halaman referensi untuk fitur baru"
        actions={[
          {
            label: "Ekspor",
            icon: <Download className="size-4" />,
            variant: "secondary",
            hidden: !canExport,
            onClick: () => toast.info("Ekspor belum tersedia"),
            testId: "example-export",
          },
          {
            label: "Tambah",
            icon: <Plus className="size-4" />,
            onClick: () => setCreateOpen(true),
            testId: "example-add",
          },
        ]}
      />

      {isMobile ? (
        <MobileCardList
          items={items}
          isLoading={isLoading}
          keyOf={(item) => item.id}
          renderCard={(item) => (
            <MobileDataCard
              header={item.name}
              rows={[
                { label: "Status", value: <ExampleStatus status={item.status} /> },
                { label: "Dibuat", value: formatDate(item.created_at) },
              ]}
            />
          )}
          pagination={{ total, page, pageSize: PAGE_SIZE, onChange: setPage }}
        />
      ) : isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} />
      ) : items.length === 0 ? (
        <TableEmptyState message="Belum ada data" />
      ) : (
        <DataTable
          columns={COLUMNS}
          data={items}
          pagination={{
            total,
            current: page,
            pageSize: PAGE_SIZE,
            onChange: (next) => setPage(next),
          }}
        />
      )}

      <CreateExampleModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
