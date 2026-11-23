"use server";

import type { SwitchOrgResult } from "@mono/auth/server";
import { authFlow } from "@/lib/session";

import type { Org } from "../schema";

/** The orgs the signed-in user can switch to. */
export async function listOrgsAction(): Promise<Org[]> {
  return authFlow.listOrgs();
}

/**
 * Swaps the session for one scoped to `orgId` (new HttpOnly tokens). The caller
 * reloads the page on `ok` so nothing from the previous org stays cached.
 */
export async function switchOrgAction(orgId: string): Promise<SwitchOrgResult> {
  // A Server Action is a public endpoint: don't trust the argument's type.
  if (typeof orgId !== "string" || orgId.length === 0) {
    return { ok: false, message: "Organisasi tidak valid" };
  }
  return authFlow.switchOrg(orgId);
}
