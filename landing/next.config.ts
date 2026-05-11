import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The RN app at the repo root has its own package-lock.json. Pin Turbopack's
  // workspace root to landing/ so it doesn't get confused by the outer lockfile.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
