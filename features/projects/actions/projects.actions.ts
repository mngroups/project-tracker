"use server";

import { ApiError } from "@mono/auth";
import { apiClient } from "@/lib/session";

import {
  archiveProjectResponseSchema,
  type Project,
  type ProjectFormValues,
  type ProjectList,
  type ProjectListParams,
  type ProjectSummary,
  projectListResponseSchema,
  projectResponseSchema,
  projectSummaryResponseSchema,
} from "../schema";

const toBody = (values: ProjectFormValues) =>
  JSON.stringify({
    ...values,
    start_date: values.start_date || null,
    target_date: values.target_date || null,
  });

export async function listProjectsAction(params: ProjectListParams): Promise<ProjectList> {
  const res = await apiClient(
    "/v1/projects",
    { method: "GET", params: params as unknown as Record<string, unknown> },
    projectListResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function getProjectSummaryAction(): Promise<ProjectSummary> {
  const res = await apiClient(
    "/v1/projects/summary",
    { method: "GET" },
    projectSummaryResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function getProjectAction(id: string): Promise<Project> {
  const res = await apiClient(`/v1/projects/${id}`, { method: "GET" }, projectResponseSchema);
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function createProjectAction(values: ProjectFormValues): Promise<Project> {
  const res = await apiClient(
    "/v1/projects",
    { method: "POST", body: toBody(values) },
    projectResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function updateProjectAction(id: string, values: ProjectFormValues): Promise<Project> {
  const res = await apiClient(
    `/v1/projects/${id}`,
    { method: "PATCH", body: toBody(values) },
    projectResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function archiveProjectAction(id: string): Promise<void> {
  const res = await apiClient(
    `/v1/projects/${id}`,
    { method: "DELETE" },
    archiveProjectResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
}
