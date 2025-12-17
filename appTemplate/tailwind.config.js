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
          DEFAULT: "#1a1f3a", // oklch(0.208 0.042 265.755) - dark blue/purple
          foreground: "#fafafa", // oklch(0.984 0.003 247.858) - white
          50: "#f0f1f5",
          100: "#d9dbe4",
          200: "#b3b7c9",
          300: "#8d93ae",
          400: "#676f93",
          500: "#414b78",
          600: "#1a1f3a",
          700: "#14182e",
          800: "#0e1122",
          900: "#080a16",
        },
        secondary: {
          DEFAULT: "#d97757", // oklch(0.55 0.20 15) - orange/peach
          foreground: "#ffffff", // oklch(1 0 0) - white
          50: "#fef5f2",
          100: "#fde6df",
          200: "#fbcdbf",
          300: "#f9b49f",
          400: "#f79b7f",
          500: "#f5825f",
          600: "#d97757",
          700: "#b85f47",
          800: "#974737",
          900: "#762f27",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f5f5f5",
          foreground: "#737373",
        },
        accent: {
          DEFAULT: "#f5f5f5",
          foreground: "#1a1f3a",
        },
        border: "#e5e7eb",
        input: "#e5e7eb",
        ring: "#a1a1aa",
        background: "#ffffff",
        foreground: "#1a1f3a",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1f3a",
        },
      },
    },
  },
  plugins: [],
}