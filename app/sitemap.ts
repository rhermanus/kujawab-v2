import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/queries";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.kujawab.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await getSitemapData();

  const entries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
  ];

  const seenCodes = new Set<string>();

  for (const row of rows) {
    // Problem set entry (once per code)
    if (!seenCodes.has(row.code)) {
      seenCodes.add(row.code);
      entries.push({
        url: `${BASE_URL}/${row.code}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // Problem entry
    if (row.number !== null) {
      entries.push({
        url: `${BASE_URL}/${row.code}/${row.number}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
