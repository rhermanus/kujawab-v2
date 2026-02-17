"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/queries";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return { id: Number(session.user.id), username: session.user.username as string };
}

export async function createProblemSetAction(name: string, problemCount: number, category: string) {
  const user = await requireAuth();
  if (!user) return { success: false, error: "Anda harus masuk terlebih dahulu." };

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100) {
    return { success: false, error: "Nama set harus 1-100 karakter." };
  }
  if (!Number.isInteger(problemCount) || problemCount < 1) {
    return { success: false, error: "Jumlah soal harus bilangan bulat positif." };
  }
  if (!category) {
    return { success: false, error: "Kategori harus dipilih." };
  }

  const set = await prisma.problemSet.create({
    data: {
      name: trimmed,
      problemCount,
      category: category as "KOMPUTER" | "MATEMATIKA" | "FISIKA" | "KIMIA" | "BIOLOGI" | "ASTRONOMI" | "KEBUMIAN" | "EKONOMI" | "GEOGRAFI",
      status: "DRAFT",
    },
  });

  revalidatePath("/problemfactory");
  return { success: true, id: set.id };
}

export async function updateProblemSetAction(
  id: number,
  data: { name?: string; code?: string; category?: string }
) {
  const user = await requireAuth();
  if (!user) return { success: false, error: "Anda harus masuk terlebih dahulu." };

  const set = await prisma.problemSet.findUnique({ where: { id } });
  if (!set) return { success: false, error: "Set tidak ditemukan." };
  if (set.status === "PUBLISHED") return { success: false, error: "Set yang sudah diterbitkan tidak bisa diedit." };

  const update: Record<string, unknown> = {};

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed || trimmed.length > 100) {
      return { success: false, error: "Nama set harus 1-100 karakter." };
    }
    update.name = trimmed;
  }

  if (data.code !== undefined) {
    const trimmed = data.code.trim().toLowerCase();
    if (!trimmed || trimmed.length > 15) {
      return { success: false, error: "Kode harus 1-15 karakter." };
    }
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      return { success: false, error: "Kode hanya boleh huruf kecil, angka, dan tanda hubung." };
    }
    // Check uniqueness
    const existing = await prisma.problemSet.findUnique({ where: { code: trimmed } });
    if (existing && existing.id !== id) {
      return { success: false, error: "Kode sudah digunakan oleh set lain." };
    }
    update.code = trimmed;
  }

  if (data.category !== undefined) {
    update.category = data.category || null;
  }

  await prisma.problemSet.update({ where: { id }, data: update });
  revalidatePath(`/problemfactory/${id}`);
  return { success: true };
}

export async function saveProblemAction(
  problemSetId: number,
  number: number,
  description: string
) {
  const user = await requireAuth();
  if (!user) return { success: false, error: "Anda harus masuk terlebih dahulu." };

  const set = await prisma.problemSet.findUnique({ where: { id: problemSetId } });
  if (!set) return { success: false, error: "Set tidak ditemukan." };
  if (set.status === "PUBLISHED") return { success: false, error: "Set yang sudah diterbitkan tidak bisa diedit." };

  if (number < 1 || number > set.problemCount) {
    return { success: false, error: `Nomor soal harus antara 1 dan ${set.problemCount}.` };
  }

  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return { success: false, error: "Deskripsi soal terlalu pendek (minimal 10 karakter)." };
  }

  const existing = await prisma.problem.findFirst({
    where: { problemSetId, number },
  });

  if (existing) {
    await prisma.problem.update({
      where: { id: existing.id },
      data: { description: trimmed },
    });
  } else {
    await prisma.problem.create({
      data: {
        problemSetId,
        number,
        description: trimmed,
      },
    });
  }

  revalidatePath(`/problemfactory/${problemSetId}`);
  return { success: true };
}

export async function saveExtraDescriptionAction(
  problemSetId: number,
  startNumber: number,
  endNumber: number,
  description: string,
  existingId?: number
) {
  const user = await requireAuth();
  if (!user) return { success: false, error: "Anda harus masuk terlebih dahulu." };

  const set = await prisma.problemSet.findUnique({ where: { id: problemSetId } });
  if (!set) return { success: false, error: "Set tidak ditemukan." };
  if (set.status === "PUBLISHED") return { success: false, error: "Set yang sudah diterbitkan tidak bisa diedit." };

  if (startNumber < 1 || endNumber > set.problemCount || startNumber > endNumber) {
    return { success: false, error: "Rentang nomor soal tidak valid." };
  }

  const trimmed = description.trim();
  if (trimmed.length < 10) {
    return { success: false, error: "Deskripsi terlalu pendek (minimal 10 karakter)." };
  }

  if (existingId) {
    await prisma.extraDescription.update({
      where: { id: existingId },
      data: { startNumber, endNumber, description: trimmed },
    });
  } else {
    await prisma.extraDescription.create({
      data: {
        problemSetId,
        startNumber,
        endNumber,
        description: trimmed,
      },
    });
  }

  revalidatePath(`/problemfactory/${problemSetId}`);
  return { success: true };
}

export async function deleteExtraDescriptionAction(id: number) {
  const user = await requireAuth();
  if (!user) return { success: false, error: "Anda harus masuk terlebih dahulu." };

  const ed = await prisma.extraDescription.findUnique({
    where: { id },
    select: { problemSetId: true, problemSet: { select: { status: true } } },
  });
  if (!ed) return { success: false, error: "Deskripsi tambahan tidak ditemukan." };
  if (ed.problemSet.status === "PUBLISHED") return { success: false, error: "Set yang sudah diterbitkan tidak bisa diedit." };

  await prisma.extraDescription.delete({ where: { id } });
  revalidatePath(`/problemfactory/${ed.problemSetId}`);
  return { success: true };
}

export async function markReadyForReviewAction(id: number) {
  const user = await requireAuth();
  if (!user) return { success: false, error: "Anda harus masuk terlebih dahulu." };

  const set = await prisma.problemSet.findUnique({
    where: { id },
    include: { _count: { select: { problems: true } } },
  });
  if (!set) return { success: false, error: "Set tidak ditemukan." };
  if (set.status !== "DRAFT") return { success: false, error: "Hanya set draft yang bisa ditandai siap review." };
  if (set._count.problems < set.problemCount) {
    return { success: false, error: `Semua soal harus diisi terlebih dahulu (${set._count.problems}/${set.problemCount}).` };
  }

  await prisma.problemSet.update({
    where: { id },
    data: { status: "READY_FOR_REVIEW" },
  });

  revalidatePath(`/problemfactory/${id}`);
  revalidatePath("/problemfactory");
  return { success: true };
}

export async function revertToDraftAction(id: number) {
  const user = await requireAuth();
  if (!user) return { success: false, error: "Anda harus masuk terlebih dahulu." };

  const set = await prisma.problemSet.findUnique({ where: { id } });
  if (!set) return { success: false, error: "Set tidak ditemukan." };
  if (set.status !== "READY_FOR_REVIEW") return { success: false, error: "Hanya set yang siap review yang bisa dikembalikan ke draft." };

  await prisma.problemSet.update({
    where: { id },
    data: { status: "DRAFT" },
  });

  revalidatePath(`/problemfactory/${id}`);
  revalidatePath("/problemfactory");
  return { success: true };
}

export async function publishProblemSetAction(id: number) {
  const user = await requireAuth();
  if (!user) return { success: false, error: "Anda harus masuk terlebih dahulu." };

  if (!isAdmin(user.username)) return { success: false, error: "Hanya admin yang bisa menerbitkan set." };

  const set = await prisma.problemSet.findUnique({ where: { id } });
  if (!set) return { success: false, error: "Set tidak ditemukan." };
  if (set.status !== "READY_FOR_REVIEW") return { success: false, error: "Set harus berstatus 'Siap Review' untuk diterbitkan." };
  if (!set.code) return { success: false, error: "Set harus memiliki kode sebelum diterbitkan." };
  if (!set.category) return { success: false, error: "Set harus memiliki kategori sebelum diterbitkan." };

  await prisma.problemSet.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });

  revalidatePath(`/problemfactory/${id}`);
  revalidatePath("/problemfactory");
  revalidatePath("/");
  return { success: true };
}
