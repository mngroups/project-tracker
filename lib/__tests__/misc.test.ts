import { toast as uiToast } from "@mono/ui";
import { describe, expect, it } from "vitest";

import { COOKIES, SESSION_COOKIES } from "../app-config";
import { toast } from "../toast";

describe("app-config", () => {
  it("prefixes every session cookie", () => {
    expect(SESSION_COOKIES).toEqual([COOKIES.accessToken, COOKIES.refreshToken, COOKIES.username]);
    expect(COOKIES.accessToken).toBe("app_access_token");
  });
});

describe("toast", () => {
  it("is the design-system toast", () => {
    expect(toast).toBe(uiToast);
  });
});
