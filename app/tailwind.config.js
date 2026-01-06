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
          DEFAULT: "#0f172b", // oklch(0.208 0.042 265.755) - exact dark blue/purple
          foreground: "#f8fafc", // oklch(0.984 0.003 247.858) - exact white
          50: "#f0f1f5",
          100: "#d9dbe4",
          200: "#b3b7c9",
          300: "#8d93ae",
          400: "#676f93",
          500: "#414b78",
          600: "#0f172b",
          700: "#0a0f1d",
          800: "#05080f",
          900: "#000000",
        },
        secondary: {
          DEFAULT: "#cb234a", // oklch(0.55 0.20 15) - exact orange/peach
          foreground: "#ffffff", // oklch(1 0 0) - white
          50: "#fef2f4",
          100: "#fde2e7",
          200: "#fbc5cf",
          300: "#f9a8b7",
          400: "#f78b9f",
          500: "#f56e87",
          600: "#cb234a",
          700: "#a01c3b",
          800: "#75152c",
          900: "#4a0e1d",
        },
        destructive: {
          DEFAULT: "#e7000b", // oklch(0.577 0.245 27.325) - exact red
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f5f9", // oklch(0.968 0.007 247.896) - exact
          foreground: "#62748e", // oklch(0.554 0.046 257.417) - exact
        },
        accent: {
          DEFAULT: "#f1f5f9", // oklch(0.968 0.007 247.896) - exact
          foreground: "#0f172b", // oklch(0.208 0.042 265.755) - exact
        },
        border: "#e2e8f0", // oklch(0.929 0.013 255.508) - exact
        input: "#e2e8f0", // oklch(0.929 0.013 255.508) - exact
        ring: "#90a1b9", // oklch(0.704 0.04 256.788) - exact
        background: "#ffffff", // oklch(1 0 0) - exact
        foreground: "#020618", // oklch(0.129 0.042 264.695) - exact
        card: {
          DEFAULT: "#ffffff", // oklch(1 0 0) - exact
          foreground: "#020618", // oklch(0.129 0.042 264.695) - exact
        },
      },
    },
  },
  plugins: [],
}