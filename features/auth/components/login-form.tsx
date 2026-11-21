"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FloatingInput, Form } from "@mono/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import { toast } from "@/lib/toast";

import { useAuth } from "../hooks/use-auth";
import { type LoginFormValues, loginSchema } from "../schema";
import { AuthCard, AuthCardTitle, AuthLayout } from "./auth-card";

export default function LoginForm() {
  const { login, isLoggingIn } = useAuth();
  const searchParams = useSearchParams();
  const expiryNotified = useRef(false);

  // Set by the logout flow when the session died on its own, so the bounce to
  // /login doesn't look random.
  useEffect(() => {
    if (searchParams.get("reason") !== "session_expired" || expiryNotified.current) return;
    expiryNotified.current = true;
    toast.info("Sesi Anda telah berakhir. Silakan masuk kembali.");
  }, [searchParams]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { username: "", password: "" },
  });
  const { isValid, isDirty } = form.formState;

  return (
    <AuthLayout>
      <AuthCard>
        <AuthCardTitle>Masuk</AuthCardTitle>
        <Form {...form}>
          <form
            method="post"
            onSubmit={form.handleSubmit((values) => login(values))}
            className="space-y-4"
          >
            <FloatingInput
              control={form.control}
              name="username"
              label="Username"
              autoComplete="username"
              data-testid="login-username-input"
            />
            <FloatingInput
              control={form.control}
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              data-testid="login-password-input"
            />
            <Button
              className="w-full"
              type="submit"
              size="lg"
              disabled={!(isValid && isDirty) || isLoggingIn}
              data-testid="login-submit-button"
            >
              {isLoggingIn ? "Memproses…" : "Masuk"}
            </Button>
          </form>
        </Form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link href="/template" className="font-medium text-primary hover:underline">
            Tentang template
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
