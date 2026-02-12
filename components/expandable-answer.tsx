"use client";

import { useState } from "react";
import HtmlContent from "./html-content";

interface ExpandableAnswerProps {
  snippet: string;
  fullHtml: string;
}

export default function ExpandableAnswer({ snippet, fullHtml }: ExpandableAnswerProps) {
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return <HtmlContent html={fullHtml} className="text-sm mt-1" />;
  }

  return (
    <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
      <p>{snippet}</p>
      <button
        onClick={() => setExpanded(true)}
        className="text-blue-600 dark:text-blue-400 hover:underline mt-1"
      >
        lihat selengkapnya &rarr;
      </button>
    </div>
  );
}
