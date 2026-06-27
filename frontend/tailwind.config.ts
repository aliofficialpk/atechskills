import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#064E3B",
          forest: "#073F32",
          mint: "#E8F5EF",
          red: "#C8102E",
          ink: "#111827"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(6, 78, 59, 0.11)",
        card: "0 10px 28px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
