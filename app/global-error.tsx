"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Terjadi kesalahan</h2>
          <button onClick={reset} style={{ marginTop: "1rem" }}>
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
