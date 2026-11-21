"use client";

import type { ReactNode } from "react";

import {
  CLIENT_FEATURE_FLAG_KEYS,
  type ClientFeatureFlag,
  FEATURE_FLAG_DEFINITIONS,
  type FeatureFlag,
  isClientFeatureFlag,
} from "./registry";
import { resolveFeatureFlagValue } from "./resolve";

function readClientFlagConfig(): Partial<Record<ClientFeatureFlag, string>> {
  const raw = process.env.NEXT_PUBLIC_FEATURE_FLAGS;
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([key, value]) =>
        typeof value === "boolean" || typeof value === "string" ? [[key, String(value)]] : []
      )
    ) as Partial<Record<ClientFeatureFlag, string>>;
  } catch {
    return {};
  }
}

const CLIENT_FLAG_CONFIG = readClientFlagConfig();

function assertClientFlag(flag: FeatureFlag): asserts flag is ClientFeatureFlag {
  // Read the scope before narrowing: once every flag is client-scoped, `flag` is `never` below.
  const { scope } = FEATURE_FLAG_DEFINITIONS[flag];
  if (!isClientFeatureFlag(flag)) {
    throw new Error(`Feature flag "${flag}" is ${scope}-only and cannot be read by client code.`);
  }
}

export function resolveClientFeatureFlag(flag: FeatureFlag): boolean {
  assertClientFlag(flag);
  const warnOnInvalid = process.env.NODE_ENV !== "production";
  return resolveFeatureFlagValue(flag, CLIENT_FLAG_CONFIG[flag], { warnOnInvalid });
}

export function useFeatureFlag(flag: ClientFeatureFlag): boolean {
  return resolveClientFeatureFlag(flag);
}

export function FeatureFlag({
  flag,
  fallback = null,
  children,
}: {
  flag: ClientFeatureFlag;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return <>{resolveClientFeatureFlag(flag) ? children : fallback}</>;
}

export { CLIENT_FEATURE_FLAG_KEYS };
