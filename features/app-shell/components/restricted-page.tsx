import { Button } from "@mono/ui";
import Link from "next/link";

/**
 * Shown in place of a page the user may not open. `route`: offer a way back.
 * `account`: nothing in the app is reachable, so offer logout instead.
 */
export function RestrictedPage({ variant = "route" }: { variant?: "route" | "account" }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-16 text-center">
      <h1 className="text-lg font-semibold">Akses dibatasi</h1>
      <p className="text-sm text-muted-foreground">
        {variant === "account"
          ? "Akun Anda belum memiliki akses ke menu apa pun. Hubungi admin untuk meminta akses."
          : "Anda tidak memiliki akses ke halaman ini."}
      </p>
      <Button variant="secondary" asChild>
        <Link href={variant === "account" ? "/logout" : "/"}>
          {variant === "account" ? "Keluar" : "Kembali"}
        </Link>
      </Button>
    </div>
  );
}
