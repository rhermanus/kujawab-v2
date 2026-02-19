import type { Metadata } from "next";
import { Suspense } from "react";
import CompleteRegistrationForm from "./complete-registration-form";

export const metadata: Metadata = { title: "Lengkapi Pendaftaran" };

export default function CompleteRegistrationPage() {
  return (
    <Suspense>
      <CompleteRegistrationForm />
    </Suspense>
  );
}
