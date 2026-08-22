import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Deep, slightly-cool navy used for the sidebar / mobile chrome —
        // distinct from slate so the app's structural chrome doesn't get
        // confused with ordinary neutral surfaces.
        navy: {
          700: "#2e3757",
          800: "#232b47",
          900: "#1a2036",
        },
      },
    },
  },
  plugins: [],
};
export default config;
