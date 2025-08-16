/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // giữ nguyên hoặc thêm path bạn cần
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FBBF77', // cam pastel chính
          hover: '#FDBA74',   // hover
          ink: '#F59E0B',     // chữ, icon
          bg: '#FFF7ED',      // nền nhạt
          border: '#FDE6C8',  // viền nhạt
        },
      },
    },
  },
  plugins: [],
};
