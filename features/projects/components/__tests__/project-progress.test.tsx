import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProjectProgress } from "../project-progress";

describe("ProjectProgress", () => {
  it("exposes the value as a progressbar with a percent label", () => {
    render(<ProjectProgress value={45} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "45");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("45%")).toBeInTheDocument();
  });

  it("clamps out-of-range values", () => {
    render(<ProjectProgress value={140} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });
});
