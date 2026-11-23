import { redirect } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieGet = vi.fn();
const headersGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
  headers: vi.fn(async () => ({ get: headersGet })),
}));

const { default: ProtectedPage } = await import("../protected-page");

describe("ProtectedPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders children with a session", async () => {
    cookieGet.mockReturnValue({ value: "refresh" });
    const element = await ProtectedPage({ children: "content" });
    expect(element.props.children).toBe("content");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /login carrying the requested page", async () => {
    cookieGet.mockReturnValue(undefined);
    headersGet.mockReturnValue("/example");
    await ProtectedPage({ children: "content" });
    expect(redirect).toHaveBeenCalledWith("/login?next=%2Fexample");
  });
});
