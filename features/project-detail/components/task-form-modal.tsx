"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCan } from "@mono/auth/react";
import { useFormDraft } from "@mono/hooks/form-draft";
import { useModalParam } from "@mono/hooks/next";
import {
  Checkbox,
  DynamicModal,
  FloatingInput,
  Form,
  FormControl,
  FormDatePicker,
  FormField,
  FormItem,
  FormLabel,
} from "@mono/ui";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import type { Project } from "@/features/projects/schema";

import { useCreateTask, useUpdateTask } from "../hooks/use-project-mutations";
import { type TaskFormValues, taskFormSchema } from "../schema";
import { FormActions } from "./form-actions";

export const TASK_FORM_MODAL = "task-form";
const MODES = [TASK_FORM_MODAL] as const;
/** Create target: `new:<milestone id>`; edit target: the task id. */
export const newTaskTarget = (milestoneId: string) => `new:${milestoneId}`;

const EMPTY: TaskFormValues = { title: "", assignee_name: "", due_date: "", is_internal: false };

export function TaskFormModal({ project }: { project: Project }) {
  const { modal, closeModal } = useModalParam(MODES);
  const canSeeInternal = useCan("project.internal:view");
  const open = !!modal;
  const target = modal?.target ?? "";
  const milestoneId = target.startsWith("new:") ? target.slice(4) : null;
  const task = project.milestones.flatMap((m) => m.tasks).find((t) => t.id === target);
  const create = useCreateTask(project.id);
  const update = useUpdateTask(project.id);
  const mutation = task ? update : create;
  const initial: TaskFormValues = task
    ? {
        title: task.title,
        assignee_name: task.assignee_name ?? "",
        due_date: task.due_date ?? "",
        is_internal: task.is_internal,
      }
    : EMPTY;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    mode: "onChange",
    defaultValues: initial,
  });

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) form.reset(initial);
    wasOpen.current = open;
  });
  const { clearDraft } = useFormDraft(form, { key: open ? `task-form:${target}` : null });

  const close = () => {
    clearDraft();
    closeModal();
  };

  const submit = form.handleSubmit((values) => {
    // A viewer who cannot see internal tasks never sends the flag.
    const body: Partial<TaskFormValues> & { title: string } = {
      title: values.title,
      assignee_name: values.assignee_name,
      due_date: values.due_date,
      ...(canSeeInternal ? { is_internal: values.is_internal } : {}),
    };
    if (task) update.mutate({ id: task.id, values: body }, { onSuccess: close });
    else if (milestoneId) create.mutate({ milestoneId, values: body }, { onSuccess: close });
  });

  return (
    <DynamicModal
      open={open}
      onOpenChange={close}
      title={task ? "Edit Task" : "Tambah Task"}
      testId="task-form-modal"
    >
      <Form {...form}>
        <form onSubmit={submit} className="space-y-4">
          <FloatingInput control={form.control} name="title" label="Judul" />
          <FloatingInput control={form.control} name="assignee_name" label="Penanggung jawab" />
          <FormDatePicker
            control={form.control}
            name="due_date"
            label="Tenggat"
            testId="task-due-date"
          />
          {canSeeInternal && (
            <FormField
              control={form.control}
              name="is_internal"
              render={({ field }) => (
                <FormItem className="flex min-h-10 items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                      className="size-5"
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Internal</FormLabel>
                </FormItem>
              )}
            />
          )}
          <FormActions
            onCancel={close}
            pending={mutation.isPending}
            disabled={!(form.formState.isValid && (task ? form.formState.isDirty : true))}
          />
        </form>
      </Form>
    </DynamicModal>
  );
}
