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

/** `is_internal` is sent only when given: a viewer who cannot see it must not overwrite it. */
const toBody = (values: Partial<TaskFormValues>) =>
  JSON.stringify({
    ...values,
    assignee_name: values.assignee_name ? values.assignee_name : null,
    due_date: values.due_date ? values.due_date : null,
  });

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
