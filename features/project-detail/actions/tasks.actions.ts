"use server";

import { ApiError } from "@mono/auth";
import type { Task } from "@/features/projects/schema";
import { apiClient } from "@/lib/session";

import {
  emptyResponseSchema,
  type TaskFormValues,
  type TaskStatus,
  taskResponseSchema,
} from "../schema";

/**
 * Optional keys are sent only when given (`undefined` means "leave alone", so a partial update
 * never wipes a field). An emptied form field (`""`) becomes an explicit `null`.
 */
const toBody = (values: Partial<TaskFormValues>) => {
  const body: Record<string, unknown> = { ...values };
  if (values.assignee_name !== undefined) body.assignee_name = values.assignee_name || null;
  if (values.due_date !== undefined) body.due_date = values.due_date || null;
  return JSON.stringify(body);
};

async function send(path: string, method: string, body: string): Promise<Task> {
  const res = await apiClient(path, { method, body }, taskResponseSchema);
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function createTaskAction(
  projectId: string,
  milestoneId: string,
  values: Partial<TaskFormValues> & { title: string }
): Promise<Task> {
  return send(`/v1/projects/${projectId}/milestones/${milestoneId}/tasks`, "POST", toBody(values));
}

export async function updateTaskAction(
  projectId: string,
  taskId: string,
  values: Partial<TaskFormValues>
): Promise<Task> {
  return send(`/v1/projects/${projectId}/tasks/${taskId}`, "PATCH", toBody(values));
}

export async function deleteTaskAction(projectId: string, taskId: string): Promise<void> {
  const res = await apiClient(
    `/v1/projects/${projectId}/tasks/${taskId}`,
    { method: "DELETE" },
    emptyResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
}

export async function setTaskStatusAction(
  projectId: string,
  taskId: string,
  status: TaskStatus
): Promise<Task> {
  return send(
    `/v1/projects/${projectId}/tasks/${taskId}/status`,
    "PATCH",
    JSON.stringify({ status })
  );
}
