import {
  ArrowRight,
  Database,
  FileUp,
  Flag,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tentang template",
  description:
    "Kenali fondasi, fitur, dan langkah awal Monexa App Template untuk membangun aplikasi.",
};

const CAPABILITIES = [
  {
    title: "Autentikasi dan sesi",
    description:
      "Login, cookie HttpOnly, refresh token, proteksi halaman, dan alur logout sudah disiapkan.",
    icon: ShieldCheck,
  },
  {
    title: "Hak akses terpusat",
    description: "RBAC mengatur akses route dan menu dari permission yang diberikan oleh backend.",
    icon: LayoutDashboard,
  },
  {
    title: "Pola data yang konsisten",
    description:
      "Server Actions, validasi Zod, dan TanStack Query menjadi pola dasar integrasi API.",
    icon: Database,
  },
  {
    title: "Responsif sejak awal",
    description: "MoNo UI dan Tailwind CSS v4 membantu membangun pengalaman desktop dan mobile.",
    icon: Smartphone,
  },
  {
    title: "Upload dan feature flag",
    description: "Contoh upload berkas dan feature flag siap disesuaikan dengan kebutuhan.",
    icon: FileUp,
  },
  {
    title: "Siap diuji dan dirilis",
    description: "Biome, Vitest, typecheck, dan workflow CI membantu menjaga kualitas perubahan.",
    icon: Flag,
  },
];

const START_STEPS = [
  {
    title: "Gunakan template",
    description: "Buat repository baru dari template ini, lalu sesuaikan nama aplikasinya.",
  },
  {
    title: "Siapkan konfigurasi",
    description: "Atur APP_NAME, prefix cookie, API_BASE_URL, dan akses package privat sesuai tim.",
  },
  {
    title: "Mulai dari fitur contoh",
    description:
      "Jadikan features/example sebagai referensi, lalu ganti dengan domain aplikasi Anda.",
  },
];

export default function TemplatePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <span className="text-sm font-semibold tracking-wide">MONEXA / APP TEMPLATE</span>
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-muted"
          >
            Masuk ke aplikasi
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <section className="grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-20">
          <div className="space-y-6">
            <p className="text-sm font-semibold tracking-[0.18em] text-primary">
              FONDASI APLIKASI MONEXA
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
              Mulai dari fondasi yang siap dikembangkan.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Monexa App Template menyediakan struktur aplikasi, autentikasi, hak akses, pola data,
              dan tooling agar tim bisa fokus membangun fitur produk.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Jelajahi aplikasi
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link
                href="#kemampuan"
                className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-3 text-sm font-medium hover:bg-muted"
              >
                Lihat kemampuan
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
            <p className="mb-5 text-sm font-semibold tracking-wide text-muted-foreground">
              STACK UTAMA
            </p>
            <dl className="divide-y divide-border">
              <div className="flex flex-col gap-1 py-4 first:pt-0 md:flex-row md:justify-between md:gap-4">
                <dt className="text-sm text-muted-foreground">Framework</dt>
                <dd className="text-sm font-medium">Next.js 16 · React 19</dd>
              </div>
              <div className="flex flex-col gap-1 py-4 md:flex-row md:justify-between md:gap-4">
                <dt className="text-sm text-muted-foreground">Bahasa</dt>
                <dd className="text-sm font-medium">TypeScript</dd>
              </div>
              <div className="flex flex-col gap-1 py-4 md:flex-row md:justify-between md:gap-4">
                <dt className="text-sm text-muted-foreground">UI</dt>
                <dd className="text-sm font-medium">MoNo UI · Tailwind CSS v4</dd>
              </div>
              <div className="flex flex-col gap-1 py-4 last:pb-0 md:flex-row md:justify-between md:gap-4">
                <dt className="text-sm text-muted-foreground">Server state</dt>
                <dd className="text-sm font-medium">Server Actions · TanStack Query</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section id="kemampuan" className="scroll-mt-8 py-12 md:py-16">
          <div className="mb-8 max-w-2xl space-y-3">
            <p className="text-sm font-semibold tracking-wide text-primary">APA YANG SUDAH ADA</p>
            <h2 className="text-3xl font-semibold tracking-tight">Fondasi untuk kebutuhan umum</h2>
            <p className="leading-7 text-muted-foreground">
              Bagian-bagian ini menjadi titik awal, bukan batasan. Sesuaikan atau hapus sesuai
              kebutuhan aplikasi Anda.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {CAPABILITIES.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <Icon aria-hidden className="mb-4 size-5 text-primary" />
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-10 border-t border-border py-12 md:grid-cols-2 md:py-16">
          <div>
            <p className="mb-3 text-sm font-semibold tracking-wide text-primary">MULAI DI SINI</p>
            <h2 className="mb-6 text-3xl font-semibold tracking-tight">Tiga langkah pertama</h2>
            <ol className="space-y-5">
              {START_STEPS.map(({ title, description }, index) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {index + 1}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl bg-muted p-6 md:p-8">
            <p className="mb-3 text-sm font-semibold tracking-wide">STRUKTUR FITUR</p>
            <h2 className="mb-4 text-2xl font-semibold">Tempatkan kode sesuai tanggung jawab</h2>
            <pre className="overflow-x-auto rounded-xl border border-border bg-card p-4 text-sm leading-7">
              <code>{`app/(protected)/  route dan shell
features/<domain>/  aksi, hooks, komponen
lib/  session, permission, query, flags`}</code>
            </pre>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Halaman <code>features/example</code> menunjukkan pola list, state loading, tampilan
              mobile, modal form, dan feature flag.
            </p>
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-border py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>Monexa App Template · Siap menjadi fondasi aplikasi berikutnya.</p>
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Lanjut ke aplikasi
          </Link>
        </footer>
      </div>
    </main>
  );
}
