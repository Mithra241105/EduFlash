/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark base palette
        void: '#050508',
        surface: {
          DEFAULT: '#0d0d14',
          raised: '#12121c',
          high: '#18182a',
          overlay: '#1e1e30',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        // Indigo accent
        indigo: {
          glow: '#6366f1',
          DEFAULT: '#818cf8',
          light: '#a5b4fc',
          dim: 'rgba(99,102,241,0.15)',
          ring: 'rgba(129,140,248,0.25)',
        },
        // Emerald accent (correct / success)
        emerald: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dim: 'rgba(16,185,129,0.15)',
          ring: 'rgba(52,211,153,0.25)',
        },
        // Rose accent (incorrect / error)
        rose: {
          DEFAULT: '#f43f5e',
          light: '#fb7185',
          dim: 'rgba(244,63,94,0.15)',
          ring: 'rgba(251,113,133,0.25)',
        },
        // Amber accent (streak / XP)
        amber: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dim: 'rgba(245,158,11,0.15)',
        },
        // Text
        text: {
          primary: '#f1f1f8',
          secondary: '#9898b8',
          muted: '#5c5c78',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        // Glass/elevation shadows for dark
        'glass': '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-raised': '0 0 0 1px rgba(255,255,255,0.10), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glass-indigo': '0 0 0 1px rgba(99,102,241,0.3), 0 8px 32px rgba(99,102,241,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glass-emerald': '0 0 0 1px rgba(16,185,129,0.3), 0 8px 32px rgba(16,185,129,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-rose': '0 0 0 1px rgba(244,63,94,0.3), 0 8px 32px rgba(244,63,94,0.12), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.3)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-ring': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(1.05)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.4s ease forwards',
        'spin-slow': 'spin-slow 1.5s linear infinite',
        'pulse-ring': 'pulse-ring 2s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'slide-in': 'slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
        'shimmer-gradient': 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%)',
      },
    },
  },
  plugins: [],
}
