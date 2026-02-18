"use client";

import { useState } from "react";
import Image from "next/image";
import { CircleUser } from "lucide-react";
import { profilePicUrl } from "@/lib/format";

const sizeMap: Record<string, number> = {
  "w-6": 24,
  "w-8": 32,
  "w-10": 40,
  "w-20": 80,
};

function extractSize(className: string): number {
  for (const [key, value] of Object.entries(sizeMap)) {
    if (className.includes(key)) return value;
  }
  return 40;
}

export default function ProfilePic({
  path,
  alt = "",
  className = "w-10 h-10",
  expandable = false,
}: {
  path: string | null;
  alt?: string;
  className?: string;
  expandable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isPlaceholder = !path || path === "/profpic_placeholder.jpg";

  if (isPlaceholder) {
    return (
      <CircleUser className={`${className} text-zinc-400 shrink-0`} strokeWidth={1.5} />
    );
  }

  const url = profilePicUrl(path);
  const size = extractSize(className);
  const imgClassName = `${className} rounded-full object-cover shrink-0${expandable ? " cursor-pointer" : ""}`;

  return (
    <>
      {url.startsWith("/") ? (
        <Image
          src={url}
          alt={alt}
          width={size}
          height={size}
          className={imgClassName}
          onClick={expandable ? () => setOpen(true) : undefined}
        />
      ) : (
        <img
          src={url}
          alt={alt}
          className={imgClassName}
          onClick={expandable ? () => setOpen(true) : undefined}
        />
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setOpen(false)}
        >
          <img
            src={url}
            alt={alt}
            className="max-h-[80vh] max-w-[80vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
