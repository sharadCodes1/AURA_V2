import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Near-black neutral surfaces with a single confident accent.
        bg: "#09090b",
        surface: "#141417",
        surface2: "#1b1b1f",
        line: "#2a2a30",
        accent: {
          DEFAULT: "#2dd4bf", // teal-400
          soft: "#0d9488",
          dim: "#134e4a",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(45,212,191,0.4), 0 0 40px -8px rgba(45,212,191,0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
