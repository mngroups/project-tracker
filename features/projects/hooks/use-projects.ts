"use client";

import { getErrorMessage } from "@mono/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/lib/toast";

import {
  archiveProjectAction,
  createProjectAction,
  getProjectAction,
  getProjectSummaryAction,
  listProjectsAction,
  updateProjectAction,
} from "../actions/projects.actions";
import type { ProjectFormValues, ProjectListParams } from "../schema";

export const PROJECTS_KEY = ["projects"] as const;

export function useProjects(params: ProjectListParams) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, "list", params],
    queryFn: () => listProjectsAction(params),
    // Paged list: refetch on every visit, keep the previous page while the next loads.
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}

export function useProjectSummary() {
  return useQuery({
    queryKey: [...PROJECTS_KEY, "summary"],
    queryFn: () => getProjectSummaryAction(),
    staleTime: 30_000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, "detail", id],
    queryFn: () => getProjectAction(id),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ProjectFormValues) => createProjectAction(values),
    onSuccess: () => {
      toast.success("Project berhasil dibuat");
      return qc.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: ProjectFormValues) => updateProjectAction(id, values),
    onSuccess: () => {
      toast.success("Project berhasil diperbarui");
      return qc.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveProjectAction(id),
    onSuccess: () => {
      toast.success("Project diarsipkan");
      return qc.invalidateQueries({ queryKey: PROJECTS_KEY });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
