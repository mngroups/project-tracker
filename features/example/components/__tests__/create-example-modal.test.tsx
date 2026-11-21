import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/render";

const createExampleAction = vi.fn();
vi.mock("../../actions/example.actions", () => ({
  createExampleAction,
  getExamplesAction: vi.fn(),
}));
vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { CreateExampleModal } = await import("../create-example-modal");

describe("CreateExampleModal", () => {
  const onOpenChange = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("submits a valid form and closes", async () => {
    createExampleAction.mockResolvedValue({ id: "1" });
    renderWithProviders(<CreateExampleModal open onOpenChange={onOpenChange} />);

    const save = await screen.findByRole("button", { name: "Simpan" });
    expect(save).toBeDisabled();
    await userEvent.type(screen.getByTestId("example-name"), "Alpha");
    await waitFor(() => expect(save).toBeEnabled());

    fireEvent.click(save);
    await waitFor(() =>
      expect(createExampleAction).toHaveBeenCalledWith({ name: "Alpha", note: "" })
    );
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("closes on Batal", async () => {
    renderWithProviders(<CreateExampleModal open onOpenChange={onOpenChange} />);
    fireEvent.click(await screen.findByRole("button", { name: "Batal" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
