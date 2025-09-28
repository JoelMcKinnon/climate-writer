import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        ccl: {
          blue:   '#1177BD',
          blue600:'#0B5E97',
          blue700:'#0A4E7D',
          green:  '#8CC63E',
          green600:'#6AA82C',
          green50: '#ECF6E3',
          sand50: '#F6F7F2'
        }
      },
      borderRadius: { xl: '14px', '2xl': '18px' },
      boxShadow: { card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)' },
      fontFamily: { heading: ['Nunito','system-ui','-apple-system','Segoe UI','Roboto','sans-serif'] }
    }
  },
  plugins: [forms]
} satisfies Config
