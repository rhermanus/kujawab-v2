"use client";

import { useRef, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface HtmlContentProps {
  html: string;
  className?: string;
}

// TODO: Remove this once images are imported locally
const PROD_ORIGIN = "https://www.kujawab.com";

function proxyRelativeImages(rawHtml: string): string {
  return rawHtml.replace(/src="(\/[^"]+)"/g, `src="${PROD_ORIGIN}$1"`);
}

export default function HtmlContent({ html, className }: HtmlContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const processedHtml = proxyRelativeImages(html);

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
