import type { Metadata } from "next";
import { Suspense } from "react";

import LoginForm from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage() {
  // LoginForm reads ?reason=, so it needs a Suspense boundary to stay prerenderable.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
