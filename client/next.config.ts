import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serveur autonome et léger, utilisé par le Dockerfile de prod (TM-25)
  output: "standalone",
};

export default nextConfig;