"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function PendingRegistrationRedirect() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session?.pendingRegistration && !pathname.startsWith("/register")) {
      router.replace("/register/complete");
    }
  }, [session, pathname, router]);

  return null;
}
