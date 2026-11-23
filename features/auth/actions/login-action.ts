"use server";

import { ApiError, AUTH_TIMEOUT_MS, reasonOf } from "@mono/auth";
import { getErrorMessage } from "@mono/utils";
import { cookies } from "next/headers";
import { COOKIES } from "@/lib/app-config";
import { apiClient, setAuthCookies } from "@/lib/session";

import { type LoginFormValues, loginResponseSchema } from "../schema";

export type LoginResult =
  | { success: true }
  | { success: false; message: string; status?: number; reason?: string };

/**
 * Exchanges credentials for tokens and stores them in HttpOnly cookies — the
 * tokens never reach browser JS. Returns a result instead of throwing so the
 * BE's (Indonesian) message reaches the toast as-is.
 */
export async function loginAction(values: LoginFormValues): Promise<LoginResult> {
  try {
    const res = await apiClient(
      "/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify(values),
        // A previous session's token can't help a login; it only adds latency.
        skipAuthRefresh: true,
        timeoutMs: AUTH_TIMEOUT_MS,
      },
      loginResponseSchema
    );
    if (!res.success) {
      return { success: false, message: res.message, status: res.code, reason: reasonOf(res) };
    }

    const { access_token, refresh_token, expires_in, refresh_expires_in } = res.data;
    await setAuthCookies(access_token, refresh_token, expires_in, refresh_expires_in);
    (await cookies()).set({
      name: COOKIES.username,
      value: values.username,
      httpOnly: false,
      path: "/",
      maxAge: refresh_expires_in,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error),
      status: error instanceof ApiError ? error.status : undefined,
      reason: reasonOf(error),
    };
  }
}
