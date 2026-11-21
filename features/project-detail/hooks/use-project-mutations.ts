"use client";

import { getErrorMessage } from "@mono/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { PROJECTS_KEY } from "@/features/projects/hooks/use-projects";
import type { Project } from "@/features/projects/schema";
import { toast } from "@/lib/toast";

import {
  approveMilestoneAction,
  createMilestoneAction,
  deleteMilestoneAction,
  reorderMilestonesAction,
  requestMilestoneChangesAction,
  submitMilestoneAction,
  updateMilestoneAction,
} from "../actions/milestones.actions";
import {
  createTaskAction,
  deleteTaskAction,
  setTaskStatusAction,
  updateTaskAction,
} from "../actions/tasks.actions";
import type { MilestoneFormValues, TaskFormValues, TaskStatus } from "../schema";

const detailKey = (projectId: string) => [...PROJECTS_KEY, "detail", projectId] as const;

/** Shared mutation shell: toast, then refetch the detail and every list/summary. */
function useProjectMutation<V>(
  projectId: string,
  mutationFn: (values: V) => Promise<unknown>,
  successMessage: string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      return Promise.all([
        qc.invalidateQueries({ queryKey: detailKey(projectId) }),
        qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
      ]);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export const useCreateMilestone = (projectId: string) =>
  useProjectMutation(
    projectId,
    (values: MilestoneFormValues) => createMilestoneAction(projectId, values),
    "Milestone ditambahkan"
  );

export const useUpdateMilestone = (projectId: string) =>
  useProjectMutation(
    projectId,
    (v: { id: string; values: MilestoneFormValues }) =>
      updateMilestoneAction(projectId, v.id, v.values),
    "Milestone diperbarui"
  );

export const useDeleteMilestone = (projectId: string) =>
  useProjectMutation(
    projectId,
    (id: string) => deleteMilestoneAction(projectId, id),
    "Milestone dihapus"
  );

export const useReorderMilestones = (projectId: string) =>
  useProjectMutation(
    projectId,
    (ids: string[]) => reorderMilestonesAction(projectId, ids),
    "Urutan milestone diperbarui"
  );

export const useSubmitMilestone = (projectId: string) =>
  useProjectMutation(
    projectId,
    (id: string) => submitMilestoneAction(projectId, id),
    "Milestone diajukan untuk persetujuan"
  );

export const useApproveMilestone = (projectId: string) =>
  useProjectMutation(
    projectId,
    (v: { id: string; note: string }) => approveMilestoneAction(projectId, v.id, { note: v.note }),
    "Milestone disetujui"
  );

export const useRequestMilestoneChanges = (projectId: string) =>
  useProjectMutation(
    projectId,
    (v: { id: string; note: string }) =>
      requestMilestoneChangesAction(projectId, v.id, { note: v.note }),
    "Permintaan revisi dikirim"
  );

export const useCreateTask = (projectId: string) =>
  useProjectMutation(
    projectId,
    (v: { milestoneId: string; values: Partial<TaskFormValues> & { title: string } }) =>
      createTaskAction(projectId, v.milestoneId, v.values),
    "Task ditambahkan"
  );

export const useUpdateTask = (projectId: string) =>
  useProjectMutation(
    projectId,
    (v: { id: string; values: Partial<TaskFormValues> }) =>
      updateTaskAction(projectId, v.id, v.values),
    "Task diperbarui"
  );

export const useDeleteTask = (projectId: string) =>
  useProjectMutation(projectId, (id: string) => deleteTaskAction(projectId, id), "Task dihapus");

/** Toggles a task with an optimistic update of the detail cache; rolls back and toasts on error. */
export function useSetTaskStatus(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { taskId: string; status: TaskStatus }) =>
      setTaskStatusAction(projectId, v.taskId, v.status),
    onMutate: async ({ taskId, status }) => {
      await qc.cancelQueries({ queryKey: detailKey(projectId) });
      const previous = qc.getQueryData<Project>(detailKey(projectId));
      if (previous) {
        qc.setQueryData<Project>(detailKey(projectId), {
          ...previous,
          milestones: previous.milestones.map((m) => ({
            ...m,
            tasks: m.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
          })),
        });
      }
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) qc.setQueryData(detailKey(projectId), context.previous);
      toast.error(getErrorMessage(error));
    },
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: detailKey(projectId) }),
        qc.invalidateQueries({ queryKey: PROJECTS_KEY }),
      ]),
  });
}
