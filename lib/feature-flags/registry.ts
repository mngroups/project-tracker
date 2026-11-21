type FeatureFlagScope = "client" | "server";

type FeatureFlagDefinition = {
  envVar: string;
  defaultValue: boolean;
  scope: FeatureFlagScope;
  description: string;
};

// Add flags with `pnpm flag:new <name> --description "…"` (see docs/guides/feature-flags.md).
export const FEATURE_FLAGS = {
  exampleFlag: {
    envVar: "NEXT_PUBLIC_FEATURE_FLAGS",
    defaultValue: false,
    scope: "client",
    description: "Shows the flag-gated export button on the example page.",
  },
} as const satisfies Record<string, FeatureFlagDefinition>;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

/**
 * The registry seen through its declared shape. Reads go through this so the
 * scope checks stay valid while every registered flag shares one scope.
 */
export const FEATURE_FLAG_DEFINITIONS: Record<FeatureFlag, FeatureFlagDefinition> = FEATURE_FLAGS;

type FlagsByScope<TScope extends FeatureFlagScope> = {
  [K in FeatureFlag]: (typeof FEATURE_FLAGS)[K]["scope"] extends TScope ? K : never;
}[FeatureFlag];

export type ClientFeatureFlag = FlagsByScope<"client">;
export type ServerFeatureFlag = FlagsByScope<"server">;

export const FEATURE_FLAG_KEYS = Object.keys(FEATURE_FLAGS) as FeatureFlag[];

export const CLIENT_FEATURE_FLAG_KEYS = FEATURE_FLAG_KEYS.filter(
  (flag): flag is ClientFeatureFlag => FEATURE_FLAG_DEFINITIONS[flag].scope === "client"
);

export const SERVER_FEATURE_FLAG_KEYS = FEATURE_FLAG_KEYS.filter(
  (flag): flag is ServerFeatureFlag => FEATURE_FLAG_DEFINITIONS[flag].scope === "server"
);

export function isClientFeatureFlag(flag: FeatureFlag): flag is ClientFeatureFlag {
  return FEATURE_FLAG_DEFINITIONS[flag].scope === "client";
}
