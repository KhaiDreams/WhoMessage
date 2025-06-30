import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-border": "var(--card-border)",
        primary: "var(--primary)",
        "primary-dark": "var(--primary-dark)",
        accent: "var(--accent)",
        "input-bg": "var(--input-bg)",
        "input-border": "var(--input-border)",
        "input-placeholder": "var(--input-placeholder)",
        "input-text": "var(--input-text)",
        "input-focus": "var(--input-focus)",
      },
    },
  },
  plugins: [],
};
export default config;
