export function timeAgo(date: Date): string {
  const now = Date.now();
  const seconds = Math.floor((now - date.getTime()) / 1000);

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
