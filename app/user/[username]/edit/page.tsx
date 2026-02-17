import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Edit Profil" };
import { auth } from "@/auth";
import { getUserByUsername } from "@/lib/queries";
import ProfileEditForm from "./profile-edit-form";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { username } = await params;
  const user = await getUserByUsername(decodeURIComponent(username));

  if (!user) notFound();
  if (session.user.id !== String(user.id)) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit profil</h1>
      <ProfileEditForm user={user} />
    </main>
  );
}
