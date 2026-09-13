import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep the repo free of auto-generated AGENTS.md / CLAUDE.md on every `next dev`.
  agentRules: false,
};

export default nextConfig;
