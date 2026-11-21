"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFormDraft } from "@mono/hooks/form-draft";
import { DynamicModal, FloatingInput, FloatingTextarea, Form } from "@mono/ui";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { useCreateExample } from "../hooks/use-example";
import { type CreateExampleValues, createExampleSchema } from "../schema";

const EMPTY: CreateExampleValues = { name: "", note: "" };

/**
 * Modal form wired the standard way: opened through the URL (the caller uses
 * `useModalToggle`), values kept as a draft so a refresh restores them.
 */
export function CreateExampleModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createExample = useCreateExample();
  const form = useForm<CreateExampleValues>({
    resolver: zodResolver(createExampleSchema),
    mode: "onChange",
    defaultValues: EMPTY,
  });

  // Reset on open, before the draft hook restores saved values.
  useEffect(() => {
    if (open) form.reset(EMPTY);
  }, [open, form]);
  const { clearDraft } = useFormDraft(form, { key: open ? "example:create" : null });

  const close = () => {
    clearDraft();
    onOpenChange(false);
  };

  const submit = form.handleSubmit((values) => createExample.mutate(values, { onSuccess: close }));

  const { isValid, isDirty } = form.formState;

  return (
    <DynamicModal
      open={open}
      // Opening goes through the URL, so the modal only ever reports a close.
      onOpenChange={close}
      title="Tambah Data"
      confirmLabel="Simpan"
      cancelLabel="Batal"
      onConfirm={submit}
      onCancel={close}
      confirmDisabled={!(isValid && isDirty)}
      loading={createExample.isPending}
      testId="create-example-modal"
    >
      <Form {...form}>
        <form onSubmit={submit} className="space-y-4">
          <FloatingInput
            control={form.control}
            name="name"
            label="Nama"
            data-testid="example-name"
          />
          <FloatingTextarea control={form.control} name="note" label="Catatan" />
        </form>
      </Form>
    </DynamicModal>
  );
}
