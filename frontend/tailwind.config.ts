import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#005CFF",
          bg: "#1A1F2B",
          glow: "#00D1FF",
          warn: "#FFB800"
        }
      }
    }
  },
  plugins: []
} satisfies Config;


