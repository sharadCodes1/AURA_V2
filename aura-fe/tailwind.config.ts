import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        aura: {
          bg: "#0b0f19",
          panel: "#141a2a",
          accent: "#6366f1",
          accent2: "#22d3ee",
        },
      },
    },
  },
  plugins: [],
};

export default config;
