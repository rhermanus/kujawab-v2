"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface UpdateProfileInput {
  firstName: string;
  lastName: string;
  bio: string;
  location: string;
  website: string;
  profilePicture?: string | null;
}

export async function updateProfileAction(input: UpdateProfileInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Anda harus masuk terlebih dahulu." };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const bio = input.bio.trim();
  const location = input.location.trim();
  const website = input.website.trim();

  if (!firstName) {
    return { success: false, error: "Nama depan wajib diisi." };
  }
  if (firstName.length > 50) {
    return { success: false, error: "Nama depan maksimal 50 karakter." };
  }
  if (lastName.length > 50) {
    return { success: false, error: "Nama belakang maksimal 50 karakter." };
  }
  if (bio.length > 160) {
    return { success: false, error: "Bio maksimal 160 karakter." };
  }
  if (location.length > 30) {
    return { success: false, error: "Lokasi maksimal 30 karakter." };
  }
  if (website.length > 100) {
    return { success: false, error: "Website maksimal 100 karakter." };
  }

  const data: Record<string, string | null> = {
    firstName,
    lastName: lastName || null,
    bio: bio || null,
    location: location || null,
    website: website || null,
  };

  if (input.profilePicture !== undefined) {
    data.profilePicture = input.profilePicture;
  }

  const user = await prisma.user.update({
    where: { id: Number(session.user.id) },
    data,
    select: { username: true },
  });

  revalidatePath(`/user/${user.username}`);
  return { success: true };
}
