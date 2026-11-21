import { Button, StickyFormFooter } from "@mono/ui";
import { Loader2 } from "lucide-react";

type FormActionsProps = {
  onCancel: () => void;
  submitLabel?: string;
  pending: boolean;
  disabled?: boolean;
};

/** Batal / Simpan row pinned to the bottom of a modal form on mobile. */
export function FormActions({
  onCancel,
  submitLabel = "Simpan",
  pending,
  disabled = false,
}: FormActionsProps) {
  return (
    <StickyFormFooter surface="modal" className="flex justify-end gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-10"
        onClick={onCancel}
        disabled={pending}
      >
        Batal
      </Button>
      <Button type="submit" className="min-h-10" disabled={pending || disabled}>
        {pending && <Loader2 className="animate-spin" />}
        {submitLabel}
      </Button>
    </StickyFormFooter>
  );
}
