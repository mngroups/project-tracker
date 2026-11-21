"use server";

import { ApiError } from "@mono/auth";
import { apiClient } from "@/lib/session";

import { type AuthCheckData, authCheckSchema } from "../schema";

/** The current user's resolved permissions (`GET /v1/auth/check`). */
export async function getAuthCheckAction(): Promise<AuthCheckData> {
  const res = await apiClient("/v1/auth/check", { method: "GET" }, authCheckSchema);
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}
