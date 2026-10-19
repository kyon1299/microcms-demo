import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // microCMS にアップロードした画像の配信元
    remotePatterns: [{ protocol: "https", hostname: "images.microcms-assets.io" }],
  },
};

export default nextConfig;
