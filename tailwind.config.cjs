/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          accent: '#14B8A6',
          deep: '#0F172A',
          surface: '#F8FAFC',
          border: '#E2E8F0'
        }
      },
      fontFamily: {
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular']
      },
      boxShadow: {
        soft: '0 8px 24px rgba(15, 23, 42, 0.08)',
        hover: '0 16px 36px rgba(15, 23, 42, 0.12)'
      },
      borderRadius: {
        xl: '20px'
      }
    },
  },
  plugins: [],
}
