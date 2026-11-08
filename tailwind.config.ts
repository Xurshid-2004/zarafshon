import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 700: '#1A2230', 800: '#121821', 900: '#070A0F' },
        bone: { 50: '#F7F4EE', 100: '#EDE8DF' },
        bronze: { 400: '#E0B47A', 500: '#C9965A' },
        status: { available: '#2DD4A7', reserved: '#F0A33C', sold: '#D4556B' },
      },
      screens: {
        short: { raw: '(max-height: 640px)' },
        tiny: { raw: '(max-height: 520px)' },
      },
      fontFamily: {
        serif: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { arch: '0.18em' },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.18)',
        lift: '0 18px 48px rgba(0,0,0,0.28)',
      },
    },
  },
  plugins: [],
} satisfies Config;
