import { afterEach, describe, expect, it, vi } from "vitest";

const createSession = vi.fn((_config: unknown) => ({ apiClient: vi.fn() }));
vi.mock("@mono/auth/server", () => ({ createSession }));

describe("lib/session", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    createSession.mockClear();
  });

  it("wires @mono/auth with this app's cookies and BE URL", async () => {
    vi.stubEnv("API_BASE_URL", "https://be.test");
    vi.stubEnv("API_CLIENT_DEBUG", "true");
    const session = await import("../session");

    expect(session.apiClient).toBeTypeOf("function");
    expect(createSession).toHaveBeenCalledWith({
      apiBaseUrl: "https://be.test",
      cookies: {
        accessToken: "app_access_token",
        refreshToken: "app_refresh_token",
        extra: ["app_username"],
      },
      debug: true,
    });
  });

  it("keeps request tracing off by default", async () => {
    await import("../session");
    expect(createSession.mock.calls[0][0]).toMatchObject({ debug: false });
  });
});
