"use client";

import { useState } from "react";
import { CircleUser } from "lucide-react";
import { profilePicUrl } from "@/lib/format";

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

  return (
    <>
      <img
        src={url}
        alt={alt}
        className={`${className} rounded-full object-cover shrink-0${expandable ? " cursor-pointer" : ""}`}
        onClick={expandable ? () => setOpen(true) : undefined}
      />
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
