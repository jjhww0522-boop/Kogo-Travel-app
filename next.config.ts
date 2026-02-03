import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Injected when server starts (npm run dev / npm run build)
    // Helps identify which version is running (Cursor AI vs Terminal, etc.)
    NEXT_PUBLIC_APP_VERSION: "1.0.1",
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
