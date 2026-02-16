"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

export default function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/notifications"
      className="relative text-white/80 hover:text-white"
      aria-label="Notifikasi"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
