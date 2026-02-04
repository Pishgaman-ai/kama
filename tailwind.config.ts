import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: "#735FF2",
          yellow: "#FCEB4B",
          orange: "#FF7456",
          green: "#5CB563",
          violet: "#A356B6",
          gray: "#D9D9D9",
          lightgray: "#BEBEC0",
          dark: "#1E1E1E",
        },
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
} satisfies Config;
