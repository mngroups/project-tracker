"use client";

import { getErrorMessage } from "@mono/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/lib/toast";

import { createExampleAction, getExamplesAction } from "../actions/example.actions";
import type { CreateExampleValues, ExampleListParams } from "../schema";

export const EXAMPLE_KEY = ["example"] as const;

export function useExamples(params: ExampleListParams) {
  return useQuery({
    queryKey: [...EXAMPLE_KEY, "list", params],
    queryFn: () => getExamplesAction(params),
    // Paged list: refetch on every visit, keep the previous page while the next loads.
    staleTime: 0,
    placeholderData: (prev) => prev,
  });
}

export function useCreateExample() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values: CreateExampleValues) => createExampleAction(values),
    onSuccess: () => {
      toast.success("Data berhasil ditambahkan");
      return qc.invalidateQueries({ queryKey: EXAMPLE_KEY });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
