import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TemplatePage from "../page";

describe("TemplatePage", () => {
  it("explains the template and links into the app", () => {
    render(<TemplatePage />);

    expect(
      screen.getByRole("heading", { name: "Mulai dari fondasi yang siap dikembangkan." })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Fondasi untuk kebutuhan umum" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", {
        name: /Masuk ke aplikasi|Jelajahi aplikasi|Lanjut ke aplikasi/,
      })
    ).toHaveLength(3);
  });
});
