import { afterEach, describe, expect, it, vi } from "vitest";

const createSession = vi.fn((_config: unknown) => ({ apiClient: vi.fn() }));
const createAuthFlow = vi.fn((_config: unknown) => ({ mode: "credentials" }));
vi.mock("@mono/auth/server", () => ({ createSession, createAuthFlow }));

describe("lib/session", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    createSession.mockClear();
    createAuthFlow.mockClear();
  });

  it("wires @mono/auth with this app's cookies and BE URL", async () => {
    vi.stubEnv("API_BASE_URL", "https://be.test");
    vi.stubEnv("API_CLIENT_DEBUG", "true");
    const session = await import("../session");

    expect(session.apiClient).toBeTypeOf("function");
    expect(createSession).toHaveBeenCalledWith({
      apiBaseUrl: "https://be.test",
      cookies: {
        accessToken: "pt_access_token",
        refreshToken: "pt_refresh_token",
        extra: ["pt_username"],
      },
      debug: true,
    });
  });

  it("keeps request tracing off by default", async () => {
    await import("../session");
    expect(createSession.mock.calls[0][0]).toMatchObject({ debug: false });
  });

  it("builds the auth flow on the same session, in the configured mode", async () => {
    vi.stubEnv("AUTH_MODE", "sso");
    const session = await import("../session");
    expect(session.authFlow).toEqual({ mode: "credentials" });
    expect(createAuthFlow).toHaveBeenCalledWith({
      session: createSession.mock.results[0].value,
      mode: "sso",
      cookiePrefix: "pt",
    });
  });
});
