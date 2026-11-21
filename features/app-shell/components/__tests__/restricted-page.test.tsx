import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RestrictedPage } from "../restricted-page";

describe("RestrictedPage", () => {
  it("offers a way back for a single route", () => {
    render(<RestrictedPage />);
    expect(screen.getByText("Anda tidak memiliki akses ke halaman ini.")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });

  it("offers logout when nothing is reachable", () => {
    render(<RestrictedPage variant="account" />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/logout");
    expect(screen.getByText("Keluar")).toBeInTheDocument();
  });
});
