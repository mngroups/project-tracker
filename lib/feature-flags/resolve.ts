import { FEATURE_FLAG_DEFINITIONS, type FeatureFlag } from "./registry";

type ResolveFeatureFlagOptions = {
  warnOnInvalid?: boolean;
};

export function parseBooleanFlag(value: string | undefined): boolean | null {
  if (value === undefined || value === "") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function resolveFeatureFlagValue(
  flag: FeatureFlag,
  value: string | undefined,
  options: ResolveFeatureFlagOptions = {}
): boolean {
  const definition = FEATURE_FLAG_DEFINITIONS[flag];
  const parsed = parseBooleanFlag(value);

  if (parsed !== null) return parsed;

  if (value !== undefined && value !== "" && options.warnOnInvalid) {
    console.warn(
      `[feature-flags] Ignoring invalid value for ${definition.envVar}. Use "true" or "false".`
    );
  }

  return definition.defaultValue;
}
