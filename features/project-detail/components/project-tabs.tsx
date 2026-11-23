"use client";

import { TabBar } from "@mono/ui";
import { useSearchParams } from "next/navigation";

export const PROJECT_TABS = ["ringkasan", "milestone", "file"] as const;
export type ProjectTab = (typeof PROJECT_TABS)[number];

const TAB_ITEMS = [
  { key: "ringkasan", label: "Ringkasan" },
  { key: "milestone", label: "Milestone" },
  { key: "file", label: "File" },
] as const satisfies readonly { key: ProjectTab; label: string }[];

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
  // TabBar, not Tabs: the page swaps its own content, so only the tab strip is rendered.
  return (
    <TabBar
      items={TAB_ITEMS}
      active={value}
      onChange={onChange}
      bleed
      aria-label="Bagian project"
    />
  );
}
