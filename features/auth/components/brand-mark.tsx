"use client";

import { useEffect, useRef, useState } from "react";

import { APP_NAME } from "@/lib/app-config";

const IMG_CLASS = "max-h-22 max-w-[min(280px,100%)] object-contain";

/**
 * The client's logo (served by monexa-auth) for the top of the auth card: the default logo in
 * light mode and the white `?variant=dark` one in dark mode. The app name replaces it when
 * there is no logo or the default fails to load; a missing dark variant falls back to the
 * default. Never a broken-image icon.
 */
export function BrandMark({ logoUrl }: { logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const [darkFailed, setDarkFailed] = useState(false);
  const img = useRef<HTMLImageElement>(null);
  const darkImg = useRef<HTMLImageElement>(null);

  // /login is server-rendered: a 404 that lands before hydration fires its error event before
  // React listens, so check each image's state once mounted too.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth === 0) setFailed(true);
    if (darkImg.current?.complete && darkImg.current.naturalWidth === 0) setDarkFailed(true);
  }, []);

  if (!logoUrl || failed) {
    return (
      <p className="mb-6 text-center text-2xl font-bold tracking-wide text-card-foreground">
        {APP_NAME}
      </p>
    );
  }
  const darkUrl = `${logoUrl}?variant=dark`;
  return (
    <div className="mb-6 flex justify-center">
      {/* biome-ignore lint/performance/noImgElement: cross-origin logo from the auth portal; next/image would need a remotePatterns entry per deployment for a tiny cached file. */}
      <img
        ref={img}
        src={logoUrl}
        alt={APP_NAME}
        onError={() => setFailed(true)}
        className={`${IMG_CLASS} ${darkFailed ? "" : "dark:hidden"}`}
      />
      {!darkFailed && (
        // biome-ignore lint/performance/noImgElement: same cross-origin logo, white variant.
        <img
          ref={darkImg}
          src={darkUrl}
          alt={APP_NAME}
          onError={() => setDarkFailed(true)}
          className={`hidden dark:block ${IMG_CLASS}`}
        />
      )}
    </div>
  );
}
