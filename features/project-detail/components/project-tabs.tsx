"use client";

import { Tabs, TabsList, TabsTrigger } from "@mono/ui";
import { cn } from "@mono/utils";
import { useSearchParams } from "next/navigation";

export const PROJECT_TABS = ["ringkasan", "milestone", "file"] as const;
export type ProjectTab = (typeof PROJECT_TABS)[number];

const TAB_LABEL: Record<ProjectTab, string> = {
  ringkasan: "Ringkasan",
  milestone: "Milestone",
  file: "File",
};

const isTab = (value: string | null): value is ProjectTab =>
  PROJECT_TABS.includes(value as ProjectTab);

/** Active tab from `?tab=`; a missing or unknown value falls back to `ringkasan`. */
export function useProjectTab(): [ProjectTab, (tab: ProjectTab) => void] {
  const raw = useSearchParams().get("tab");
  const tab = isTab(raw) ? raw : "ringkasan";
  const set = (next: ProjectTab) => {
    // Keeps unrelated params (`modal`, `target`, ...).
    const params = new URLSearchParams(window.location.search);
    params.set("tab", next);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };
  return [tab, set];
}

export function ProjectTabs({
  value,
  onChange,
}: {
  value: ProjectTab;
  onChange: (tab: ProjectTab) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ProjectTab)}>
      <TabsList
        variant="line"
        aria-label="Bagian project"
        className={cn("w-full flex-nowrap justify-start overflow-x-auto")}
      >
        {PROJECT_TABS.map((key) => (
          <TabsTrigger key={key} value={key} className="min-h-10 shrink-0 px-4">
            {TAB_LABEL[key]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
