/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="cyberpunk"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono:  ['Share Tech Mono', 'monospace'],
        title: ['Outfit', 'sans-serif'],
      },
      colors: {
        background: '#0B0F19',
        surface:    '#1A1F2E',
        primary: {
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
        },
        accent: {
          400: '#A78BFA',
          500: '#8B5CF6',
        },
        neon: {
          cyan:  '#00f5ff',
          pink:  '#ff00c8',
          green: '#00ff41',
          amber: '#fbbf24',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient':  'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
        'neon-gradient':   'linear-gradient(135deg, var(--theme-neon-primary), var(--theme-neon-accent))',
      },
      boxShadow: {
        'glass':     '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'neon-sm':   '0 0 8px var(--theme-neon-primary)',
        'neon-md':   '0 0 16px var(--theme-neon-primary), 0 0 4px var(--theme-neon-primary)',
        'neon-lg':   '0 0 30px var(--theme-neon-primary), 0 0 10px var(--theme-neon-primary)',
      },
      animation: {
        'neon-pulse':    'neon-pulse 2s ease-in-out infinite',
        'matrix-scan':   'matrix-scan 1.5s linear infinite',
        'float':         'float 20s ease-in-out infinite alternate',
        'spin-slow':     'spin 3s linear infinite',
      },
      backdropBlur: {
        xs:   '2px',
        '3xl': '48px',
        '4xl': '64px',
      },
    },
  },
  plugins: [],
}
