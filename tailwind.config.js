/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        access: {
          green: {
            DEFAULT: '#047857', // emerald-700 (4.5+:1 against light bg)
            light: '#d1fae5',
            dark: '#064e3b',
          },
          yellow: {
            DEFAULT: '#b45309', // amber-700
            light: '#fef3c7',
            dark: '#78350f',
          },
          red: {
            DEFAULT: '#b91c1c', // red-700
            light: '#fee2e2',
            dark: '#7f1d1d',
          },
          unknown: {
            DEFAULT: '#475569', // slate-600
            light: '#f1f5f9',
            dark: '#1e293b',
          },
        },
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}
