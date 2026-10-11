/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'canvas-default': '#090D16',
        'background': '#0B1326',
        'surface-base': '#0F172A',
        'surface-raised': '#1E293B',
        'surface-overlay': '#243248',
        'border-subtle': '#334155',
        'border-focus': '#38BDF8',
        'primary': '#06B6D4',
        'primary-hover': '#22D3EE',
        'secondary': '#38BDF8',
        'accent-violet': '#8B5CF6',
        // Stitch Token Semantics
        'surface': '#0B1326',
        'surface-dim': '#0B1326',
        'surface-bright': '#31394D',
        'surface-container-lowest': '#060E20',
        'surface-container-low': '#131B2E',
        'surface-container': '#171F33',
        'surface-container-high': '#222A3D',
        'surface-container-highest': '#2D3449',
        'on-surface': '#DAE2FD',
        'on-surface-variant': '#BCC9CD',
        'outline': '#869397',
        'outline-variant': '#3D494C',
        'primary-container': '#06B6D4',
        'on-primary-container': '#00424F',
        // SecOps Decision Tokens
        'status-allow': '#10B981',
        'status-block': '#EF4444',
        'status-sanitize': '#F59E0B',
        'status-escalate': '#8B5CF6',
        'error': '#FFB4AB',
        'error-container': '#93000A',
        'on-error-container': '#FFDAD6',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      }
    },
  },
  plugins: [],
}
