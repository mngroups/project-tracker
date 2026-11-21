"use client";

import { clearAllFormDrafts } from "@mono/hooks/form-draft";
import { Button } from "@mono/ui";

import { AuthCard, AuthCardTitle, AuthLayout } from "@/features/auth/components/auth-card";

export function LogoutCard({
  formAction,
  isSessionExpired,
}: {
  formAction: string;
  isSessionExpired: boolean;
}) {
  return (
    <AuthLayout>
      <AuthCard className="text-center">
        <AuthCardTitle>
          {isSessionExpired ? "Sesi Anda telah berakhir" : "Konfirmasi logout"}
        </AuthCardTitle>
        <p className="mb-6 text-sm leading-6 text-gray-500">
          {isSessionExpired
            ? "Masuk kembali untuk melanjutkan pekerjaan Anda."
            : "Klik tombol di bawah untuk mengakhiri sesi di perangkat ini."}
        </p>
        {/* Unsent modal drafts belong to this session; the next user of the tab sees none. */}
        <form method="post" action={formAction} onSubmit={clearAllFormDrafts}>
          <Button className="w-full" type="submit" size="lg" data-testid="logout-submit-button">
            {isSessionExpired ? "Masuk kembali" : "Logout"}
          </Button>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
