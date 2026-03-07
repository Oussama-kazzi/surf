import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ================================
      // SURFBOOK DESIGN SYSTEM — COLOR TOKENS
      // ================================
      colors: {
        // Primary: Ocean Blue
        ocean: {
          50: "#f0f7ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#7cb9f0",
          400: "#3b93e6",
          500: "#1a73d4",
          600: "#0c5dba",
          700: "#0a4a94",
          800: "#0d3d7a",
          900: "#0f3366",
          950: "#0a1f3f",
        },
        // Secondary: Turquoise / Teal
        teal: {
          50: "#effcfc",
          100: "#d6f5f5",
          200: "#b0eaec",
          300: "#79d8de",
          400: "#3bbdc7",
          500: "#1fa1ad",
          600: "#1b8292",
          700: "#1c6977",
          800: "#1f5562",
          900: "#1e4753",
        },
        // Accent: Sunset Orange
        sunset: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#ffd8a8",
          300: "#fdb872",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea5e0c",
          700: "#c14e0c",
          800: "#9a3f12",
          900: "#7c3412",
        },
        // Background: Sand
        sand: {
          50: "#faf9f7",
          100: "#f5f3ef",
          200: "#e8e4dd",
          300: "#d8d1c6",
          400: "#c2b8a8",
          500: "#ab9e8c",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        "page-title": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        "section-title": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "card-title": ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 4px 12px 0 rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        "sidebar": "2px 0 8px 0 rgba(0, 0, 0, 0.04)",
        "modal": "0 20px 60px -12px rgba(0, 0, 0, 0.15)",
      },
      backgroundImage: {
        "wave-pattern": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 120'%3E%3Cpath fill='%23ffffff' d='M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,64C960,53,1056,43,1152,48C1248,53,1344,75,1392,85.3L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in-right 0.25s ease-out",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
