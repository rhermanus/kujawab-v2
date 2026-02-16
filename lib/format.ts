export function profilePicUrl(path: string | null): string {
  if (!path || path === "/profpic_placeholder.jpg") return "/profpic_placeholder.jpg";
  // Full R2 URL stored in DB → rewrite to proxy path
  if (path.includes(".r2.dev/")) return `/r2/${path.split(".r2.dev/")[1]}`;
  if (path.startsWith("http")) return path;
  // Legacy relative path → serve via /r2/ rewrite proxy
  return `/r2${path}`;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = Date.now();
  const seconds = Math.floor((now - d.getTime()) / 1000);

  if (seconds < 60) return "baru saja";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;

  const years = Math.floor(months / 12);
  return `${years} tahun lalu`;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function joinDate(date: Date): string {
  return `Bergabung ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  KOMPUTER: "Komputer",
  MATEMATIKA: "Matematika",
  FISIKA: "Fisika",
  KIMIA: "Kimia",
  BIOLOGI: "Biologi",
  ASTRONOMI: "Astronomi",
  KEBUMIAN: "Kebumian",
  EKONOMI: "Ekonomi",
  GEOGRAFI: "Geografi",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
