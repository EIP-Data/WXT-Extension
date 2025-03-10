/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: [
    "./entrypoints/**/*.{vue,js,ts,jsx,tsx}",
    "./components/**/*.{vue,js,ts,jsx,tsx}",
    "./utils/**/*.js",
  ],
  theme: {
    extend: {
        colors: {
            orangePrimary: {
                DEFAULT: "#F9AB3B",
                dark: "#E1A148FF"
            },
        },
    },
  },
}

