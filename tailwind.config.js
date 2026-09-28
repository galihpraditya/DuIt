/** @type {import('tailwindcss').Config} */
const dynamicBrandShades = {
  50: 'rgb(var(--brand-50) / <alpha-value>)',
  100: 'rgb(var(--brand-100) / <alpha-value>)',
  200: 'rgb(var(--brand-200) / <alpha-value>)',
  300: 'rgb(var(--brand-300) / <alpha-value>)',
  400: 'rgb(var(--brand-400) / <alpha-value>)',
  500: 'rgb(var(--brand-500) / <alpha-value>)',
  600: 'rgb(var(--brand-600) / <alpha-value>)',
  700: 'rgb(var(--brand-700) / <alpha-value>)',
  800: 'rgb(var(--brand-800) / <alpha-value>)',
  900: 'rgb(var(--brand-900) / <alpha-value>)',
  950: 'rgb(var(--brand-950) / <alpha-value>)',
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: dynamicBrandShades,
        emerald: dynamicBrandShades, // Map existing emerald classes to dynamic theme brand
        expense: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
        }
      },
      fontFamily: {
        sans: ['var(--font-ui, "Plus Jakarta Sans")', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
        'elevated': '0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 8px 16px -4px rgba(0, 0, 0, 0.03)',
        'glass': '0 12px 32px -12px rgba(15, 23, 42, 0.12)',
        'glass-lg': '0 24px 64px -16px rgba(15, 23, 42, 0.25)',
        'glow-emerald': '0 0 25px -5px rgb(var(--brand-500) / 0.35)',
        'glow-brand': '0 0 25px -5px rgb(var(--brand-500) / 0.35)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.35)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
