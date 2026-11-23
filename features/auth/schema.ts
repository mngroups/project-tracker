import { apiEnvelope } from "@mono/auth";
import { z } from "zod";

export const loginSchema = z.object({
  // `.min(1)`: z.string() alone accepts "" and the form would submit empty.
  username: z.string().trim().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const loginResponseSchema = apiEnvelope(
  z.object({
    access_token: z.string().min(1),
    refresh_token: z.string().min(1),
    expires_in: z.number(),
    refresh_expires_in: z.number(),
  })
);

export const orgSchema = z.object({ id: z.string(), name: z.string() });

export type Org = z.infer<typeof orgSchema>;

export const authCheckSchema = apiEnvelope(
  z.object({
    user_id: z.string(),
    permissions: z.array(z.string()),
    // The token's active org. Optional so a BE on server-kit < 0.3.1 (no `org`) still passes.
    org: orgSchema.nullish(),
  })
);

export type AuthCheckData = z.infer<typeof authCheckSchema>["data"];
