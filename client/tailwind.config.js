/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#ffffff',
          subtle: '#fafafa',
          muted: '#f4f4f5',
          elevated: '#ffffff',
        },
        surface: {
          50: '#fcfcfc',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
        },
        ink: {
          primary: '#09090b',
          secondary: '#52525b',
          muted: '#71717a',
          faint: '#a1a1aa',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'float': '0 8px 30px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
