"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function Analytics() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip the initial load — already tracked by the inline gtag config
    if (isFirst.current) {
      console.log("Initial page load, skipping GA page_view event");
      isFirst.current = false;
      return;
    }
    console.log("Pathname changed to", pathname);
    if (!GA_ID || !window.gtag) return;
    console.log("Tracking page_view for", pathname);
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
      send_to: GA_ID,
    });
  }, [pathname]);

  return null;
}
