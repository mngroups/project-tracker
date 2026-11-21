"use server";

import { ApiError } from "@mono/auth";
import type { Milestone } from "@/features/projects/schema";
import { apiClient } from "@/lib/session";

import { emptyResponseSchema, type MilestoneFormValues, milestoneResponseSchema } from "../schema";

const toBody = (values: MilestoneFormValues) =>
  JSON.stringify({ ...values, due_date: values.due_date || null });

const noteBody = (note?: string) => JSON.stringify(note?.trim() ? { note: note.trim() } : {});

async function send(path: string, method: string, body?: string): Promise<Milestone> {
  const res = await apiClient(path, { method, body }, milestoneResponseSchema);
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function createMilestoneAction(
  projectId: string,
  values: MilestoneFormValues
): Promise<Milestone> {
  return send(`/v1/projects/${projectId}/milestones`, "POST", toBody(values));
}

export async function updateMilestoneAction(
  projectId: string,
  milestoneId: string,
  values: MilestoneFormValues
): Promise<Milestone> {
  return send(`/v1/projects/${projectId}/milestones/${milestoneId}`, "PATCH", toBody(values));
}

export async function deleteMilestoneAction(projectId: string, milestoneId: string): Promise<void> {
  const res = await apiClient(
    `/v1/projects/${projectId}/milestones/${milestoneId}`,
    { method: "DELETE" },
    emptyResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
}

export async function reorderMilestonesAction(projectId: string, ids: string[]): Promise<void> {
  const res = await apiClient(
    `/v1/projects/${projectId}/milestones/order`,
    { method: "PUT", body: JSON.stringify({ ids }) },
    emptyResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
}

export async function submitMilestoneAction(
  projectId: string,
  milestoneId: string,
  input: { note?: string } = {}
): Promise<Milestone> {
  return send(
    `/v1/projects/${projectId}/milestones/${milestoneId}/submit`,
    "POST",
    noteBody(input.note)
  );
}

export async function approveMilestoneAction(
  projectId: string,
  milestoneId: string,
  input: { note?: string } = {}
): Promise<Milestone> {
  return send(
    `/v1/projects/${projectId}/milestones/${milestoneId}/approve`,
    "POST",
    noteBody(input.note)
  );
}

export async function requestMilestoneChangesAction(
  projectId: string,
  milestoneId: string,
  input: { note?: string } = {}
): Promise<Milestone> {
  return send(
    `/v1/projects/${projectId}/milestones/${milestoneId}/request-changes`,
    "POST",
    noteBody(input.note)
  );
}
