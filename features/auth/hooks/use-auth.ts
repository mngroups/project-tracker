"use client";

import { NEXT_PARAM, sanitizeNextPath } from "@mono/auth";
import { clearAllFormDrafts } from "@mono/hooks/form-draft";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

import { loginAction } from "../actions/login-action";
import { logoutAction } from "../actions/logout-action";
import type { LoginFormValues } from "../schema";

// A logout parks the previous page in `?next=`. Re-check it: a hand-crafted URL
// could put anything there.
function readCallbackPath(): string | null {
  return sanitizeNextPath(new URLSearchParams(window.location.search).get(NEXT_PARAM));
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) => loginAction(values),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      // "/" resolves the landing route from the user's permissions.
      router.replace(readCallbackPath() ?? "/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutAction,
    onSettled: () => {
      clearAllFormDrafts();
      queryClient.clear();
      router.replace("/login");
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}
