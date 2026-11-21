import { describe, expect, it } from "vitest";

import { loginSchema } from "../schema";

describe("loginSchema", () => {
  it("rejects empty and whitespace-only credentials", () => {
    expect(loginSchema.safeParse({ username: "", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "   ", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ username: "budi", password: "" }).success).toBe(false);
  });

  it("accepts filled credentials and trims the username", () => {
    expect(loginSchema.parse({ username: " budi ", password: "x" })).toEqual({
      username: "budi",
      password: "x",
    });
  });
});
