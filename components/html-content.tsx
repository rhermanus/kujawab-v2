"use client";

import { useRef, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import imageMap from "@/lib/image-map.json";

interface HtmlContentProps {
  html: string;
  className?: string;
}

function rewriteImageUrls(rawHtml: string): string {
  return rawHtml.replace(/src="([^"]+)"/g, (match, src: string) => {
    // Full R2 URL stored in DB → rewrite to proxy path
    if (src.includes(".r2.dev/")) return `src="/r2/${src.split(".r2.dev/")[1]}"`;
    // Relative paths → serve via /r2/ rewrite proxy
    if (src.startsWith("/")) {
      // Normalize: collapse double slashes, decode HTML entities
      const normalized = src.replace(/\/\//g, "/").replace(/&amp;/g, "&");
      return `src="/r2${normalized}"`;
    }
    // External URLs → check mapping
    const mapped = (imageMap as Record<string, string>)[src];
    if (mapped) return `src="/r2/${mapped}"`;
    // No mapping → keep as-is
    return match;
  });
}

export default function HtmlContent({ html, className }: HtmlContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const processedHtml = rewriteImageUrls(html);

  useEffect(() => {
    if (!ref.current) return;

    // Find all <img> tags pointing to CodeCogs LaTeX renderer
    const imgs = ref.current.querySelectorAll<HTMLImageElement>(
      'img[src*="latex.codecogs.com"], img[src*="codecogs.com"]'
    );

    for (const img of imgs) {
      const latex = img.alt;
      if (!latex) continue;

      const span = document.createElement("span");
      try {
        katex.render(latex, span, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        span.textContent = latex;
      }

      img.replaceWith(span);
    }

    // Render math-tex spans (from TipTap editor output)
    const mathSpans = ref.current.querySelectorAll<HTMLSpanElement>(
      "span.math-tex[data-latex]"
    );
    for (const span of mathSpans) {
      if (span.querySelector(".katex")) continue; // already rendered
      const latex = span.getAttribute("data-latex");
      if (!latex) continue;
      try {
        katex.render(latex, span, {
          throwOnError: false,
          displayMode: false,
        });
      } catch {
        span.textContent = latex;
      }
    }
  }, [processedHtml]);

  return (
    <div
      ref={ref}
      className={`html-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
