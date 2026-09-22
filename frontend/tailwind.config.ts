import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172133",
        paper: "#f6f5f0",
        accent: "#6d5dfc",
        mint: "#42c39a",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(23, 33, 51, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
