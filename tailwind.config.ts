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
        bg: "#FAFAFA",
        card: "#FFFFFF",
        "primary-text": "#1A1A1A",
        "secondary-text": "#4B4B4B",
        "accent-blue": "#A3C4F3",
        mint: "#B8E0D2",
        peach: "#FDD2BF",
        border: "#E3E6EA",
        "bg-muted": "#F2F4F7",
      },
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "16px",
        cta: "48px",
      },
    },
  },
  plugins: [],
};
export default config;
