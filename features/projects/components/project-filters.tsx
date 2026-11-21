"use client";

import { FloatingSelect, Form, ListSearchInput } from "@mono/ui";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useDebouncedValue } from "../hooks/use-debounced-value";
import {
  PROJECT_HEALTH_LABEL,
  PROJECT_HEALTHS,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUSES,
  type ProjectHealth,
  type ProjectStatus,
} from "../schema";

export const ALL = "all";

export type ProjectFilterValues = {
  search: string;
  status: ProjectStatus | undefined;
  health: ProjectHealth | undefined;
};

const STATUS_OPTIONS = [
  { label: "Semua status", value: ALL },
  ...PROJECT_STATUSES.map((value) => ({ label: PROJECT_STATUS_LABEL[value], value })),
];
const HEALTH_OPTIONS = [
  { label: "Semua kesehatan", value: ALL },
  ...PROJECT_HEALTHS.map((value) => ({ label: PROJECT_HEALTH_LABEL[value], value })),
];

type SelectValues = { status: string; health: string };

/** Search (debounced) and status/health selects. The URL owns the values; this only reports changes. */
export function ProjectFilters({
  values,
  onChange,
}: {
  values: ProjectFilterValues;
  onChange: (patch: Partial<ProjectFilterValues>) => void;
}) {
  const [search, setSearch] = useState(values.search);
  const debounced = useDebouncedValue(search, 300);
  const form = useForm<SelectValues>({
    defaultValues: { status: values.status ?? ALL, health: values.health ?? ALL },
  });

  useEffect(() => {
    if (debounced !== values.search) onChange({ search: debounced });
  }, [debounced, values.search, onChange]);

  return (
    <Form {...form}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <ListSearchInput value={search} onChange={setSearch} label="Cari kode atau nama" />
        <FloatingSelect
          control={form.control}
          name="status"
          label="Status"
          options={STATUS_OPTIONS}
          onOptionSelect={({ value }) =>
            onChange({ status: value === ALL ? undefined : (value as ProjectStatus) })
          }
        />
        <FloatingSelect
          control={form.control}
          name="health"
          label="Kesehatan"
          options={HEALTH_OPTIONS}
          onOptionSelect={({ value }) =>
            onChange({ health: value === ALL ? undefined : (value as ProjectHealth) })
          }
        />
      </div>
    </Form>
  );
}
