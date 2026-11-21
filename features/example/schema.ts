import { apiEnvelope } from "@mono/auth";
import { z } from "zod";

export const exampleItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["active", "inactive"]),
  created_at: z.string(),
});

export type ExampleItem = z.infer<typeof exampleItemSchema>;

export const exampleListResponseSchema = apiEnvelope(
  z.object({
    items: z.array(exampleItemSchema),
    total: z.number(),
  })
);

export type ExampleList = z.infer<typeof exampleListResponseSchema>["data"];

export type ExampleListParams = { page: number; page_size: number; search?: string };

export const createExampleSchema = z.object({
  // `.min(1)`: z.string() alone accepts "".
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Maksimal 100 karakter"),
  note: z.string().max(500, "Maksimal 500 karakter"),
});

export type CreateExampleValues = z.infer<typeof createExampleSchema>;

export const createExampleResponseSchema = apiEnvelope(exampleItemSchema);
