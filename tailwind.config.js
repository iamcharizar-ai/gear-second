/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Samsung Health 2026 dark palette — near-black + one warm effort accent.
        ink: '#0a0b0d',
        card: '#16181d',
        'card-2': '#1e2128',
        line: '#2a2e37',
        text: '#f2f4f7',
        dim: '#9aa0ad',
        faint: '#5b616e',
        // single muted accent family for effort / PRs (Strong's "one accent" rule)
        accent: '#ff7a45', // ember
        'accent-soft': '#ffb28a',
        gold: '#ffd166',
        good: '#38d39f',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        num: ['"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
      },
    },
  },
  plugins: [],
}
