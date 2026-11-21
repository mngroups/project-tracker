import { describe, expect, it } from "vitest";

import {
  createQueryClient,
  isNavigationSignal,
  isRetryableQueryError,
  queryRetryDelay,
} from "../client";

describe("query client", () => {
  it("recognises navigation signals", () => {
    expect(isNavigationSignal({ digest: "NEXT_REDIRECT;/login" })).toBe(true);
    expect(isNavigationSignal(new Error("NEXT_REDIRECT"))).toBe(true);
    expect(isNavigationSignal(new Error("boom"))).toBe(false);
    expect(isNavigationSignal(null)).toBe(false);
  });

  it("retries only transient failures", () => {
    expect(isRetryableQueryError({ digest: "NEXT_REDIRECT" })).toBe(false);
    expect(isRetryableQueryError({ status: 404 })).toBe(false);
    expect(isRetryableQueryError({ status: 429 })).toBe(true);
    expect(isRetryableQueryError({ status: 503 })).toBe(true);
    expect(isRetryableQueryError(new Error("masked"))).toBe(true);
  });

  it("backs off up to 5s", () => {
    expect(queryRetryDelay(0)).toBe(1000);
    expect(queryRetryDelay(10)).toBe(5000);
  });

  it("applies the retry policy", () => {
    const retry = createQueryClient().getDefaultOptions().queries?.retry as (
      count: number,
      error: unknown
    ) => boolean;
    expect(retry(0, { status: 500 })).toBe(true);
    expect(retry(2, { status: 500 })).toBe(false);
  });
});
