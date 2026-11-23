import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BrandMark } from "../brand-mark";

describe("BrandMark", () => {
  const LOGO = "https://auth.test/branding/orgs/pt/logo";

  it("renders the default and dark logos with theme visibility classes", () => {
    const { container } = render(<BrandMark logoUrl={LOGO} />);
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("src", LOGO);
    expect(imgs[0]).toHaveAttribute("alt", "Project Tracker");
    expect(imgs[0]).toHaveClass("dark:hidden");
    expect(imgs[1]).toHaveAttribute("src", `${LOGO}?variant=dark`);
    expect(imgs[1]).toHaveClass("hidden", "dark:block");
  });

  it("shows the default logo in dark mode when the dark variant fails", () => {
    const { container } = render(<BrandMark logoUrl={LOGO} />);
    fireEvent.error(container.querySelectorAll("img")[1]);
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("src", LOGO);
    expect(imgs[0]).not.toHaveClass("dark:hidden");
  });

  it("falls back to the app name when the logo can't load", () => {
    const { container } = render(<BrandMark logoUrl={LOGO} />);
    fireEvent.error(container.querySelectorAll("img")[0]);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Project Tracker")).toBeInTheDocument();
  });

  it("shows the app name without a logo", () => {
    render(<BrandMark logoUrl={null} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Project Tracker")).toBeInTheDocument();
  });

  describe("a logo that already failed before hydration", () => {
    afterEach(() => vi.restoreAllMocks());

    it("falls back once mounted, even though no error event reaches React", () => {
      vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
      vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);
      render(<BrandMark logoUrl="https://auth.test/branding/orgs/none/logo" />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(screen.getByText("Project Tracker")).toBeInTheDocument();
    });

    it("drops only the dark variant when it failed before hydration", () => {
      vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
      vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockImplementation(function (
        this: HTMLImageElement
      ) {
        return this.src.endsWith("variant=dark") ? 0 : 120;
      });
      const { container } = render(<BrandMark logoUrl={LOGO} />);
      const imgs = container.querySelectorAll("img");
      expect(imgs).toHaveLength(1);
      expect(imgs[0]).not.toHaveClass("dark:hidden");
    });

    it("keeps a logo that loaded before hydration", () => {
      vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
      vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(120);
      render(<BrandMark logoUrl={LOGO} />);
      expect(screen.getAllByRole("img", { hidden: true })).toHaveLength(2);
    });
  });
});
