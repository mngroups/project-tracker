"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFormDraft } from "@mono/hooks/form-draft";
import { useModalToggle } from "@mono/hooks/next";
import { DynamicModal, FloatingInput, FloatingSelect, FloatingTextarea, Form } from "@mono/ui";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import { useCreateProject, useUpdateProject } from "../hooks/use-projects";
import {
  PROJECT_HEALTH_LABEL,
  PROJECT_HEALTHS,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUSES,
  type Project,
  type ProjectFormValues,
  projectFormSchema,
} from "../schema";

const EMPTY: ProjectFormValues = {
  code: "",
  name: "",
  description: "",
  status: "planning",
  health: "on_track",
  start_date: "",
  target_date: "",
};

const STATUS_OPTIONS = PROJECT_STATUSES.map((value) => ({
  label: PROJECT_STATUS_LABEL[value],
  value,
}));
const HEALTH_OPTIONS = PROJECT_HEALTHS.map((value) => ({
  label: PROJECT_HEALTH_LABEL[value],
  value,
}));

const toValues = (project: Project): ProjectFormValues => ({
  code: project.code,
  name: project.name,
  description: project.description,
  status: project.status,
  health: project.health,
  start_date: project.start_date ?? "",
  target_date: project.target_date ?? "",
});

type ProjectFormModalProps =
  | { mode: "create"; project?: undefined }
  | { mode: "edit"; project: Project };

/**
 * Create / edit form. Open state lives in `?modal=project-form` (plus `&target=<id>`
 * when editing), so any component may open it with `useModalToggle("project-form")`.
 */
export function ProjectFormModal({ mode, project }: ProjectFormModalProps) {
  const [open, setOpen] = useModalToggle("project-form", project?.id ?? null);
  const create = useCreateProject();
  const update = useUpdateProject(project?.id ?? "");
  const mutation = mode === "edit" ? update : create;
  const initial = project ? toValues(project) : EMPTY;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    mode: "onChange",
    defaultValues: initial,
  });

  // Reset on open, before the draft hook restores saved values.
  // Only on the closed -> open transition: a refetch of `project` must not wipe edits.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) form.reset(project ? toValues(project) : EMPTY);
    wasOpen.current = open;
  }, [open, form, project]);
  const { clearDraft } = useFormDraft(form, {
    key: open ? `project-form:${mode === "edit" ? `edit:${project.id}` : "create"}` : null,
  });

  const close = () => {
    clearDraft();
    setOpen(false);
  };

  const submit = form.handleSubmit((values) => mutation.mutate(values, { onSuccess: close }));
  const { isValid, isDirty } = form.formState;

  return (
    <DynamicModal
      open={open}
      // Opening goes through the URL, so the modal only ever reports a close.
      onOpenChange={close}
      title={mode === "edit" ? "Edit Project" : "Buat Project"}
      confirmLabel="Simpan"
      cancelLabel="Batal"
      onConfirm={submit}
      onCancel={close}
      confirmDisabled={!(isValid && isDirty)}
      loading={mutation.isPending}
      testId="project-form-modal"
    >
      <Form {...form}>
        <form onSubmit={submit} className="space-y-4">
          <FloatingInput control={form.control} name="code" label="Kode" />
          <FloatingInput control={form.control} name="name" label="Nama" />
          <FloatingTextarea control={form.control} name="description" label="Deskripsi" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FloatingSelect
              control={form.control}
              name="status"
              label="Status"
              options={STATUS_OPTIONS}
            />
            <FloatingSelect
              control={form.control}
              name="health"
              label="Kesehatan"
              options={HEALTH_OPTIONS}
            />
            <FloatingInput
              control={form.control}
              name="start_date"
              label="Tanggal mulai"
              type="date"
            />
            <FloatingInput
              control={form.control}
              name="target_date"
              label="Tanggal target"
              type="date"
            />
          </div>
        </form>
      </Form>
    </DynamicModal>
  );
}
