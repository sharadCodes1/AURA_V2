/** @type {import('next').NextConfig} */
const isTauriBuild = process.env.TAURI_BUILD === "1";

const nextConfig = {
  reactStrictMode: true,
  // For the Tauri desktop bundle we export a static site to `out/` (set via
  // TAURI_BUILD=1, which tauri.conf.json's beforeBuildCommand does). Normal web
  // `next build` / `next start` is unaffected.
  ...(isTauriBuild ? { output: "export", images: { unoptimized: true } } : {}),
};

export default nextConfig;
