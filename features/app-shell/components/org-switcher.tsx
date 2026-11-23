"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  PlainButton,
  Skeleton,
} from "@mono/ui";
import { cn, getErrorMessage } from "@mono/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { listOrgsAction, switchOrgAction } from "@/features/auth/actions/org.actions";
import type { Org } from "@/features/auth/schema";
import { toast } from "@/lib/toast";

export const ORGS_KEY = ["orgs"] as const;

/**
 * The shell's brand: the active org (with the app name beneath), and a menu to
 * switch org when the user has more than one. Lives in the AppShell `brand` slot,
 * so desktop sidebar and mobile top bar share it.
 */
export function OrgSwitcher({
  org,
  orgCount,
  appName,
}: {
  org: Org | null;
  orgCount: number;
  appName: string;
}) {
  if (!org) return <span className="truncate font-semibold">{appName}</span>;

  const label = (
    <span className="flex min-w-0 flex-col text-left leading-tight">
      <span className="truncate font-semibold">{org.name}</span>
      <span className="truncate text-xs text-muted-foreground">{appName}</span>
    </span>
  );
  if (orgCount <= 1) return label;
  return <OrgMenu active={org} label={label} />;
}

function OrgMenu({ active, label }: { active: Org; label: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Loaded on open only; staleTime 0 so membership changes show on the next open.
  const orgs = useQuery({
    queryKey: ORGS_KEY,
    queryFn: () => listOrgsAction(),
    enabled: open,
    staleTime: 0,
  });

  useEffect(() => {
    if (orgs.error) toast.error(getErrorMessage(orgs.error));
  }, [orgs.error]);

  const switchOrg = useMutation({
    // Pass only the id: a Server Action serializes every argument, and React Query
    // would add its (non-serializable) mutation context as a second one.
    mutationFn: (orgId: string) => switchOrgAction(orgId),
    onSuccess: (result) => {
      // A full reload drops every cached query of the previous org and resolves
      // the landing route from the new org's permissions.
      if (result.ok) window.location.assign("/");
      else toast.error(result.message);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <PlainButton
          type="button"
          disabled={switchOrg.isPending}
          className="flex w-full min-w-0 items-center gap-2 rounded-md text-left"
        >
          {label}
          <ChevronsUpDown aria-hidden className="ml-auto size-4 shrink-0 opacity-60" />
        </PlainButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {orgs.isPending
          ? [0, 1].map((row) => (
              <Skeleton key={row} data-testid="org-switcher-skeleton" className="m-1 h-7" />
            ))
          : orgs.data?.map((item) => {
              const isActive = item.id === active.id;
              return (
                <DropdownMenuItem
                  key={item.id}
                  aria-current={isActive ? "true" : undefined}
                  onSelect={() => {
                    if (!isActive) switchOrg.mutate(item.id);
                  }}
                >
                  <Check aria-hidden className={cn("size-4", !isActive && "invisible")} />
                  <span className="truncate">{item.name}</span>
                </DropdownMenuItem>
              );
            })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
