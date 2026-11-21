import "server-only";

import { FEATURE_FLAG_DEFINITIONS, type FeatureFlag } from "./registry";
import { resolveFeatureFlagValue } from "./resolve";

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const definition = FEATURE_FLAG_DEFINITIONS[flag];
  const warnOnInvalid = process.env.NODE_ENV !== "production";
  return resolveFeatureFlagValue(flag, process.env[definition.envVar], { warnOnInvalid });
}
