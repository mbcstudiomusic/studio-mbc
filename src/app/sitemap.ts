import { MetadataRoute } from "next";
import { getProjects } from "@/data/projets";

const SITE_URL = "https://studiombc.fr";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();

  const projectUrls = projects.map((p) => ({
    url: `${SITE_URL}/projets/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 1,
    },
    ...projectUrls,
  ];
}
