import type { Metadata } from "next";
import ChangePasswordForm from "./change-password-form";

export const metadata: Metadata = { title: "Ubah Kata Sandi" };

export default function ChangePasswordPage() {
  return <ChangePasswordForm />;
}
