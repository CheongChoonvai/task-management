/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx,tsx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  safelist: [
    'from-primary-500',
    'to-primary-600',
    'bg-primary-500',
    'bg-primary-600',
    'text-primary-500',
    'text-primary-600'
  ],
  theme: {
    extend: {
      colors: {
        // Retro pastel palettes used across the app
        autumn: {
          50:  '#fff6f2',
          100: '#fff0ea',
          200: '#fbe3d8',
          300: '#f7cdbf',
          400: '#f3b39e',
          500: '#f08a7d',
          600: '#f06e54',
          700: '#d9654b',
          800: '#b8523d',
          900: '#8f3f2f'
        },
        primary: {
          50:  '#f2eef9',
          100: '#ebe6f6',
          200: '#dfd7f0',
          300: '#c9b9ea',
          400: '#a991e0',
          500: '#8b6fd6',
          600: '#5b3e96',
          700: '#4a3377',
          800: '#392658',
          900: '#281a3a'
        },
        // Map Tailwind's blue/indigo palettes to your custom teal/green theme
        // This lets existing `bg-blue-600`, `text-blue-600`, `from-blue-600` etc. render
        // with your provided colors without editing component files.
        // map any blue usage to primary tokens so buttons using `bg-blue-*` become green
        blue: {
          50:  'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)'
        },
        // Keep a `green` alias in case components reference it explicitly
        // ensure explicit `green` utilities use the primary tokens (keeps semantics)
        green: {
          50:  'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)'
        },
        // map indigo to primary so any `indigo` utilities used for buttons become green
        indigo: {
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)'
        },
        // semantic alias using CSS variables so runtime theming works
        primary: {
          50:  'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)'
        },
        // Surface color for cards and panels (soft neutral)
        surface: {
          DEFAULT: 'var(--surface)',
          50: 'var(--gray-50)',
          100: 'var(--gray-100)'
        }
      }
    }
  },
  plugins: []
}
