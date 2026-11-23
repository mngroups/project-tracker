import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test-utils/render";

const getProjectSummaryAction = vi.fn();
vi.mock("../../actions/projects.actions", () => ({ getProjectSummaryAction }));

const { ProjectSummaryTiles } = await import("../project-summary-tiles");

describe("ProjectSummaryTiles", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows a skeleton, then the counts", async () => {
    getProjectSummaryAction.mockResolvedValue({
      total: 12,
      on_track: 7,
      at_risk: 3,
      off_track: 1,
      completed: 1,
      awaiting_approval: 4,
    });
    renderWithProviders(<ProjectSummaryTiles />);
    expect(screen.getByTestId("summary-tiles-skeleton")).toBeInTheDocument();
    const total = await screen.findByTestId("summary-total");
    expect(within(total).getByText("12")).toBeInTheDocument();
    expect(within(screen.getByTestId("summary-on_track")).getByText("7")).toBeInTheDocument();
    expect(within(screen.getByTestId("summary-at_risk")).getByText("3")).toBeInTheDocument();
    expect(within(screen.getByTestId("summary-off_track")).getByText("1")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("summary-awaiting_approval")).getByText("4")
    ).toBeInTheDocument();
    expect(screen.getByText("Menunggu persetujuan")).toBeInTheDocument();
  });

  it("uses a 2 column grid below md and 5 from md", async () => {
    getProjectSummaryAction.mockResolvedValue({
      total: 0,
      on_track: 0,
      at_risk: 0,
      off_track: 0,
      completed: 0,
      awaiting_approval: 0,
    });
    renderWithProviders(<ProjectSummaryTiles />);
    const grid = (await screen.findByTestId("summary-total")).parentElement;
    expect(grid).toHaveClass("grid-cols-2", "md:grid-cols-5");
  });

  it("shows dashes when the summary fails", async () => {
    getProjectSummaryAction.mockRejectedValue(new Error("x"));
    renderWithProviders(<ProjectSummaryTiles />);
    expect(await within(await screen.findByTestId("summary-total")).findByText("-")).toBeVisible();
  });
});
