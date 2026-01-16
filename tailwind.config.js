/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'vibrant-purple': '#8B5CF6',
        'vibrant-pink': '#EC4899',
        'deep-violet': '#2E1065',
        'sky-blue': '#0EA5E9',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'floating': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 15px rgba(236, 72, 153, 0.5)',
      }
    },
  },
  plugins: [],
};
