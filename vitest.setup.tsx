import "@testing-library/jest-dom";
import { clearAllFormDrafts } from "@mono/hooks/form-draft";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/* ------------------------------------------------------------------
 * next/navigation (App Router)
 * ------------------------------------------------------------------ */
// Search params follow `window.location`, like the App Router's patched
// history API: `pushState`/`replaceState`/`popstate` re-render readers. That
// keeps URL-driven state (e.g. `?modal=` forms) working in component tests.
const locationListeners = new Set<() => void>();
const notifyLocation = () => {
  for (const listener of locationListeners) listener();
};
for (const method of ["pushState", "replaceState"] as const) {
  const original = window.history[method].bind(window.history);
  window.history[method] = (...args: Parameters<History["pushState"]>) => {
    original(...args);
    notifyLocation();
  };
}
window.addEventListener("popstate", notifyLocation);
const subscribeLocation = (listener: () => void) => {
  locationListeners.add(listener);
  return () => {
    locationListeners.delete(listener);
  };
};

// `findBy*`/`waitFor` give up after 1s by default, too tight on a loaded CI
// runner with coverage on (see `testTimeout` in vitest.config.ts).
configure({ asyncUtilTimeout: process.env.CI ? 5_000 : 1_000 });

afterEach(() => {
  // Unmount first: importing RTL here registers its auto-cleanup before this
  // hook, so it would otherwise run last, and a form unmounting after
  // `clearAllFormDrafts()` saves its draft again and leaks into the next test.
  cleanup();
  window.history.replaceState(null, "", "/");
  clearAllFormDrafts();
});

vi.mock("next/navigation", async () => {
  const { useMemo, useSyncExternalStore } = await import("react");
  const push = vi.fn();
  const replace = vi.fn();
  const back = vi.fn();
  const refresh = vi.fn();
  const prefetch = vi.fn();

  return {
    useRouter: () => ({
      push,
      replace,
      back,
      refresh,
      prefetch,
    }),
    usePathname: () => "/",
    useSearchParams: () => {
      const search = useSyncExternalStore(
        subscribeLocation,
        () => window.location.search,
        () => ""
      );
      return useMemo(() => new URLSearchParams(search), [search]);
    },
    useParams: () => ({}),
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
});

/* ------------------------------------------------------------------
 * next/link
 * ------------------------------------------------------------------ */
vi.mock("next/link", () => {
  return {
    default: ({ href, children }: any) => (
      <a href={href} data-testid="next-link">
        {children}
      </a>
    ),
  };
});

/* ------------------------------------------------------------------
 * next/image
 * ------------------------------------------------------------------ */
vi.mock("next/image", () => {
  return {
    default: (props: any) => {
      return <img {...props} alt={props.alt || ""} />;
    },
  };
});

/* ------------------------------------------------------------------
 * next/head
 * ------------------------------------------------------------------ */
vi.mock("next/head", () => {
  return {
    default: ({ children }: any) => <>{children}</>,
  };
});

/* ------------------------------------------------------------------
 * next/font/*
 * ------------------------------------------------------------------ */
vi.mock("next/font/google", () => ({
  Inter: () => ({
    className: "font-inter",
    variable: "--font-inter",
  }),
}));

vi.mock("next/font/local", () => ({
  default: () => ({
    className: "font-local",
    variable: "--font-local",
  }),
}));

/* ------------------------------------------------------------------
 * next/cache
 * ------------------------------------------------------------------ */
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: any) => fn,
}));

/* ------------------------------------------------------------------
 * next/headers (Server Components)
 * ------------------------------------------------------------------ */
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Headers()),
}));

/* ------------------------------------------------------------------
 * next/server
 * ------------------------------------------------------------------ */
vi.mock("next/server", () => ({
  NextResponse: class NextResponse extends Response {
    cookies = {
      deleted: [] as Array<{ name: string; path?: string }>,
      delete: (input: string | { name: string; path?: string }) => {
        this.cookies.deleted.push(typeof input === "string" ? { name: input } : input);
      },
    };

    static json(data: any, init?: ResponseInit) {
      return new Response(JSON.stringify(data), init);
    }

    static redirect = vi.fn();
  },
  NextRequest: vi.fn(),
}));

/* ------------------------------------------------------------------
 * Web APIs missing in jsdom
 * ------------------------------------------------------------------ */
Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

Object.defineProperty(globalThis, "IntersectionObserver", {
  writable: true,
  value: class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

/* ------------------------------------------------------------------
 * matchMedia (Tailwind / responsive hooks)
 * ------------------------------------------------------------------ */
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
