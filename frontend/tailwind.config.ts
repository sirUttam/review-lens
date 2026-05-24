import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#09090f',
        panel: '#11121a',
        border: '#27283a',
        accent: '#68d391',
        muted: '#94a3b8',
      },
    },
  },
  plugins: [],
};

export default config;
