/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // When wrapping in Tauri (desktop build), switch to a static export:
  //   output: "export",
  // and serve the `out/` dir from Tauri. Left off for normal web dev.
};

export default nextConfig;
