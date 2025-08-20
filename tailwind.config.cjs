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
