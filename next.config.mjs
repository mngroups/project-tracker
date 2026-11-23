// Content-Security-Policy is set per request in proxy.ts (lib/security-headers.ts): its
// form-action depends on AUTH_PORTAL_URL at runtime. Don't add a second CSP here — browsers
// enforce every CSP header, so a stricter static one would still block the sso redirects.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const NO_STORE_HEADERS = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "Pragma", value: "no-cache" },
  { key: "Expires", value: "0" },
];

// CI type-checks in its own job; set NEXT_SKIP_BUILD_CHECKS=true there to skip
// repeating it in the build. Linting is Biome's job (`pnpm lint`), never the build's.
const skipBuildChecks = process.env.NEXT_SKIP_BUILD_CHECKS === "true";

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Set per build in CI (e.g. the git SHA) to tag assets with the build they came from.
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
  // @mono/* ship plain ESM and need no transpiling.
  typescript: { ignoreBuildErrors: skipBuildChecks },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/login", headers: NO_STORE_HEADERS },
      { source: "/logout", headers: NO_STORE_HEADERS },
    ];
  },
};

export default nextConfig;
