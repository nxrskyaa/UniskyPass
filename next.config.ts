import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep resolution inside this repository. A parent-level lockfile on the
    // Windows host must not make Turbopack treat C:\Users\xywal as the app root.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
