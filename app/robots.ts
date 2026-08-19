import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/cprday/my-venues/"],
      },
    ],
    sitemap: "https://mbbsfoundation.com/sitemap.xml",
  };
}
