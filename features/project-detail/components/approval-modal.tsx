"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFormDraft } from "@mono/hooks/form-draft";
import { useModalParam } from "@mono/hooks/next";
import { Button, DynamicModal, FloatingTextarea, Form, StickyFormFooter } from "@mono/ui";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import type { Project } from "@/features/projects/schema";

import { useApproveMilestone, useRequestMilestoneChanges } from "../hooks/use-project-mutations";
import { type ApprovalFormValues, approvalFormSchema } from "../schema";

export const APPROVAL_MODAL = "approval";
const MODES = [APPROVAL_MODAL] as const;

/** Approve / request-changes dialog for one milestone; `target` is the milestone id. */
export function ApprovalModal({ project }: { project: Project }) {
  const { modal, closeModal } = useModalParam(MODES);
  const open = !!modal;
  const milestone = project.milestones.find((m) => m.id === modal?.target);
  const approve = useApproveMilestone(project.id);
  const requestChanges = useRequestMilestoneChanges(project.id);
  // A stale link or a concurrent decision must not allow deciding again.
  const decidable = milestone?.status === "awaiting_approval";
  const pending = approve.isPending || requestChanges.isPending;

  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalFormSchema),
    mode: "onChange",
    defaultValues: { note: "" },
  });

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) form.reset({ note: "" });
    wasOpen.current = open;
  }, [open, form]);
  const { clearDraft } = useFormDraft(form, {
    key: open ? `approval:${modal?.target}` : null,
  });

  const close = () => {
    clearDraft();
    closeModal();
  };

  const decide = (kind: "approve" | "revise") =>
    form.handleSubmit(({ note }) => {
      if (!milestone || !decidable) return;
      if (kind === "revise" && !note) {
        form.setError("note", { message: "Catatan revisi wajib diisi" });
        return;
      }
      const mutation = kind === "approve" ? approve : requestChanges;
      mutation.mutate({ id: milestone.id, note }, { onSuccess: close });
    })();

  const tasks = milestone ? [...milestone.tasks].sort((a, b) => a.position - b.position) : [];

  return (
    <DynamicModal
      open={open}
      onOpenChange={close}
      title="Tinjau milestone"
      description={milestone?.title}
      testId="approval-modal"
    >
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {milestone?.description && (
            <p className="text-sm break-words text-muted-foreground">{milestone.description}</p>
          )}
          {tasks.length > 0 && (
            <ul className="space-y-1 text-sm">
              {tasks.map((t) => (
                <li key={t.id} className="flex min-w-0 gap-2">
                  <span aria-hidden>{t.status === "done" ? "✓" : "○"}</span>
                  <span className="min-w-0 break-words">{t.title}</span>
                </li>
              ))}
            </ul>
          )}
          <FloatingTextarea control={form.control} name="note" label="Catatan" maxChars={1000} />
          <StickyFormFooter surface="modal" className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              disabled={pending || !decidable}
              onClick={() => decide("revise")}
            >
              {requestChanges.isPending && <Loader2 className="animate-spin" />}
              Minta revisi
            </Button>
            <Button
              type="button"
              className="min-h-10"
              disabled={pending || !decidable}
              onClick={() => decide("approve")}
            >
              {approve.isPending && <Loader2 className="animate-spin" />}
              Setujui
            </Button>
          </StickyFormFooter>
        </form>
      </Form>
    </DynamicModal>
  );
}
