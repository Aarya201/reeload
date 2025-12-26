import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      process.env.MAINTENANCE_MODE === "1"
        ? {
            source: "/((?!maintenance).*)",
            destination: "/maintenance",
            permanent: false,  // Use 307 temporary redirect (not cached)
          }
        : [],
    ].flat();
  },
};

export default nextConfig;
