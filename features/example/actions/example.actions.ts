"use server";

import { ApiError } from "@mono/auth";
import { apiClient } from "@/lib/session";

import {
  type CreateExampleValues,
  createExampleResponseSchema,
  type ExampleItem,
  type ExampleList,
  type ExampleListParams,
  exampleListResponseSchema,
} from "../schema";

export async function getExamplesAction(params: ExampleListParams): Promise<ExampleList> {
  const res = await apiClient(
    "/v1/examples",
    { method: "GET", params: params as unknown as Record<string, unknown> },
    exampleListResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}

export async function createExampleAction(values: CreateExampleValues): Promise<ExampleItem> {
  const res = await apiClient(
    "/v1/examples",
    { method: "POST", body: JSON.stringify(values) },
    createExampleResponseSchema
  );
  if (!res.success) throw new ApiError(res.message, res.code, res.code);
  return res.data;
}
