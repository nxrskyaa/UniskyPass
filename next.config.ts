1|import type { NextConfig } from "next";
2|import path from "node:path";
3|
4|const nextConfig: NextConfig = {
5|  turbopack: {
6|    // Keep resolution inside this repository. A parent-level lockfile on the
7|    // Windows host must not make Turbopack treat C:\Users\user as the app root.
8|    root: path.resolve(__dirname),
9|  },
10|};
11|
12|export default nextConfig;
13|