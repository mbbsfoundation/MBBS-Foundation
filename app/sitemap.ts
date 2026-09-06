import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getAllStateHubSlugs } from "@/lib/counselling/stateHubService";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://mbbsfoundation.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // NEET to MBBS Silo
    {
      url: `${baseUrl}/neet-to-mbbs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/neet-to-mbbs/counselling`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/neet-to-mbbs/counselling/round-2`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/neet-to-mbbs/counselling/round-2-planner`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/neet-to-mbbs/counselling/neet-choice-index-2026`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.92,
    },
    {
      url: `${baseUrl}/neet-to-mbbs/choosing-a-medical-college`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/neet-to-mbbs/toolkit`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/neet-to-mbbs/parents`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/neet-to-mbbs/after-admission`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/neet-to-mbbs/readiness-quiz`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Core Existing Pages
    {
      url: `${baseUrl}/book`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/cprday`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cprsanjeevani`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    const colleges = await prisma.college.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { collegeName: "asc" },
    });

    const stateSlugs = getAllStateHubSlugs();
    const stateRoutes: MetadataRoute.Sitemap = stateSlugs.map((slug) => ({
      url: `${baseUrl}/neet-to-mbbs/counselling/state/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    const collegeRoutes: MetadataRoute.Sitemap = colleges.map((c) => ({
      url: `${baseUrl}/neet-to-mbbs/colleges/${c.slug}/counselling-2026`,
      lastModified: c.updatedAt || now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...stateRoutes, ...collegeRoutes];
  } catch (error) {
    console.error("Error generating college sitemap entries:", error);
    return staticRoutes;
  }
}