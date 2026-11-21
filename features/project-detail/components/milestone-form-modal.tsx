"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFormDraft } from "@mono/hooks/form-draft";
import { useModalParam } from "@mono/hooks/next";
import { DynamicModal, FloatingInput, FloatingTextarea, Form } from "@mono/ui";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import type { Project } from "@/features/projects/schema";

import { useCreateMilestone, useUpdateMilestone } from "../hooks/use-project-mutations";
import { type MilestoneFormValues, milestoneFormSchema } from "../schema";
import { FormActions } from "./form-actions";

export const MILESTONE_FORM_MODAL = "milestone-form";
const MODES = [MILESTONE_FORM_MODAL] as const;
/** `target` of the create form. */
export const NEW_TARGET = "new";

const EMPTY: MilestoneFormValues = { title: "", description: "", due_date: "" };

/** Create (`target=new`) or edit (`target=<milestone id>`) form, driven by `?modal=milestone-form`. */
export function MilestoneFormModal({ project }: { project: Project }) {
  const { modal, closeModal } = useModalParam(MODES);
  const open = !!modal;
  const milestone = project.milestones.find((m) => m.id === modal?.target);
  const create = useCreateMilestone(project.id);
  const update = useUpdateMilestone(project.id);
  const mutation = milestone ? update : create;
  const initial: MilestoneFormValues = milestone
    ? {
        title: milestone.title,
        description: milestone.description,
        due_date: milestone.due_date ?? "",
      }
    : EMPTY;

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    mode: "onChange",
    defaultValues: initial,
  });

  // Reset only on the closed -> open transition: a refetch must not wipe edits.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) form.reset(initial);
    wasOpen.current = open;
  });
  const { clearDraft } = useFormDraft(form, {
    key: open ? `milestone-form:${milestone?.id ?? NEW_TARGET}` : null,
  });

  const close = () => {
    clearDraft();
    closeModal();
  };

  const submit = form.handleSubmit((values) => {
    if (milestone) update.mutate({ id: milestone.id, values }, { onSuccess: close });
    else create.mutate(values, { onSuccess: close });
  });

  return (
    <DynamicModal
      open={open}
      onOpenChange={close}
      title={milestone ? "Edit Milestone" : "Tambah Milestone"}
      testId="milestone-form-modal"
    >
      <Form {...form}>
        <form onSubmit={submit} className="space-y-4">
          <FloatingInput control={form.control} name="title" label="Judul" />
          <FloatingTextarea control={form.control} name="description" label="Deskripsi" />
          <FloatingInput control={form.control} name="due_date" label="Tenggat" type="date" />
          <FormActions
            onCancel={close}
            pending={mutation.isPending}
            disabled={!(form.formState.isValid && (milestone ? form.formState.isDirty : true))}
          />
        </form>
      </Form>
    </DynamicModal>
  );
}
