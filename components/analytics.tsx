"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import { sendGAEvent } from "@next/third-parties/google";

export { sendGAEvent };

export function trackEvent(action: string, params?: Record<string, unknown>) {
  sendGAEvent({ event_name: action, ...params });
}

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    // Skip if pathname hasn't actually changed (e.g. initial render)
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Next.js clears document.title during navigation then sets the new one.
    // Poll until the new title is available before sending the event.
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (document.title || attempts >= 50) {
        clearInterval(interval);
        sendGAEvent("event", "page_view", {
          page_path: url,
          page_title: document.title,
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [pathname, searchParams]);

  return null;
}

export function RouteChangeTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
