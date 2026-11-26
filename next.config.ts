import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // PGlite ships WebAssembly and node-postgres has optional native bits: load them from node_modules.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;
