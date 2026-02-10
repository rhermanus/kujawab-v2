"use client";

import { useRef, useEffect } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface HtmlContentProps {
  html: string;
  className?: string;
}

export default function HtmlContent({ html, className }: HtmlContentProps) {
  const ref = useRef<HTMLDivElement>(null);

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
  }, [html]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
