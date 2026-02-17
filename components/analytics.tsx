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
      isFirst.current = false;
      return;
    }
    if (!GA_ID || !window.gtag) return;
    const prevTitle = document.title;
    // Wait for Next.js to update <title> in <head>
    const observer = new MutationObserver(() => {
      if (document.title !== prevTitle) {
        observer.disconnect();
        window.gtag!("event", "page_view", {
          page_path: pathname,
          page_location: window.location.href,
          page_title: document.title,
          send_to: GA_ID,
        });
      }
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
