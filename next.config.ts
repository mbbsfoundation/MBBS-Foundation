import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": ["./cprcertificates/**/*", "./cprsanjeevani/**/*", "./data/**/*"],
  },
};

export default nextConfig;
