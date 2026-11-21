import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveLandingRoute = vi.fn();
vi.mock("@/lib/permissions/server", () => ({ resolveLandingRoute }));

const { default: Home } = await import("../page");
const { default: RootLayout } = await import("../layout");
const { Providers } = await import("../providers");

describe("/ (landing)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("redirects to the first reachable menu entry", async () => {
    resolveLandingRoute.mockResolvedValue("/example");
    await Home();
    expect(redirect).toHaveBeenCalledWith("/example");
  });

  it("offers logout when nothing is reachable", async () => {
    resolveLandingRoute.mockResolvedValue(null);
    render(await Home());
    expect(screen.getByText("Akses dibatasi")).toBeInTheDocument();
  });
});

describe("RootLayout", () => {
  it("sets the language and the theme bootstrap script", () => {
    const element = RootLayout({ children: <p>child</p> });
    expect(element.props.lang).toBe("id");
    const [head] = element.props.children;
    expect(head.props.children.props.dangerouslySetInnerHTML.__html).toContain("monexa-theme");
  });
});

describe("Providers", () => {
  it("renders children inside the app providers", () => {
    render(
      <Providers>
        <p>child</p>
      </Providers>
    );
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});
