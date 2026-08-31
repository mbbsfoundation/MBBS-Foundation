import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/cprday/my-venues/",
          "/cprsanjeevani/admin-certificate",
          "/cprsanjeevani/auth",
        ],
      },
    ],
    sitemap: "https://mbbsfoundation.com/sitemap.xml",
  };
}
