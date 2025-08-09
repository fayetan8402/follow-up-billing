
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ig1: "#833AB4",
        ig2: "#C13584",
        ig3: "#E1306C",
        ig4: "#F56040",
        ig5: "#FCAF45"
      },
      borderRadius: {
        '2xl': '1.25rem'
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)"
      }
    },
  },
  plugins: [],
}
