"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { sendGAEvent } from "@next/third-parties/google";

export default function Analytics() {
  const pathname = usePathname();
  const isFirst = useRef(true);
  const prevTitleRef = useRef("");

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      prevTitleRef.current = document.title;
      return;
    }

    const prevTitle = prevTitleRef.current;
    const send = () => {
      prevTitleRef.current = document.title;
      sendGAEvent("event", "page_view", {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
    };

    // Title already updated by Next.js before this effect ran
    if (document.title && document.title !== prevTitle) {
      send();
      return;
    }

    // Otherwise wait for Next.js to update <title>
    const observer = new MutationObserver(() => {
      if (document.title && document.title !== prevTitle) {
        observer.disconnect();
        send();
      }
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
