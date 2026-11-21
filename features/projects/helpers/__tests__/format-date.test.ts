import { describe, expect, it } from "vitest";

import { formatProjectDate } from "../format-date";

describe("formatProjectDate", () => {
  it("formats YYYY-MM-DD in Indonesian without timezone shifts", () => {
    expect(formatProjectDate("2026-03-01")).toBe("1 Mar 2026");
    expect(formatProjectDate("2026-05-31")).toBe("31 Mei 2026");
    expect(formatProjectDate("2026-12-09")).toBe("9 Des 2026");
  });

  it("shows a dash when there is no date", () => {
    expect(formatProjectDate(null)).toBe("-");
  });
});
