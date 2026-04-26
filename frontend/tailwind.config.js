/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal:  { DEFAULT: "#1D9E75", light: "#E1F5EE", dark: "#0F6E56" },
        ocean: { DEFAULT: "#378ADD", light: "#E6F1FB", dark: "#185FA5" },
        amber: { DEFAULT: "#EF9F27", light: "#FAEEDA", dark: "#BA7517" },
        coral: { DEFAULT: "#D85A30", light: "#FAECE7", dark: "#993C1D" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "bounce-in":  "bounceIn 0.5s ease-out",
        "fade-in":    "fadeIn 0.3s ease-out",
      },
      keyframes: {
        bounceIn: {
          "0%":   { transform: "scale(0.8)", opacity: "0" },
          "60%":  { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
};
