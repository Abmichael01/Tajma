/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "work-sans": ["WorkSans", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#FF4F18",
          foreground: "#ffffff",
          50: "#fff1ee",
          100: "#ffe0d8",
          200: "#ffc1b1",
          300: "#ffa189",
          400: "#ff8262",
          500: "#FF4F18", // OneFood Orange
          600: "#e64716",
          700: "#bf3b12",
          800: "#992f0e",
          900: "#7d260c",
        },
        secondary: {
          DEFAULT: "#2D2D2D",
          foreground: "#ffffff",
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#2D2D2D", // Charcoal
          600: "#282828",
          700: "#212121",
          800: "#1a1a1a",
          900: "#141414",
        },
        destructive: {
          DEFAULT: "#e7000b",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#62748e",
        },
        accent: {
          DEFAULT: "#f1f5f9",
          foreground: "#0f172b",
        },
        border: "#d1d5db",
        input: "#d1d5db",
        ring: "#90a1b9",
        background: "#ffffff",
        foreground: "#020618",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#020618",
        },
      },
    },
  },
  plugins: [],
}