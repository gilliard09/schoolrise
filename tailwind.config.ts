import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors"; // Importe as cores padrão

const config: Config = {
    darkMode: "class", // Correto
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        colors: {
            // Identidade SchoolRise - Padrão Apple
            appleBlue: '#007AFF',
            appleGray: '#F5F5F7',
            cardBorder: '#E5E5E7',
            
            // Forçando a escala Indigo completa para garantir que o Tailwind reconheça
            schoolRiseIndigo: colors.indigo, 

            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            card: {
                DEFAULT: 'hsl(var(--card))',
                foreground: 'hsl(var(--card-foreground))'
            },
            primary: {
                DEFAULT: 'hsl(var(--primary))',
                foreground: 'hsl(var(--primary-foreground))'
            },
        },
        borderRadius: {
            apple: '16px',
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)'
        }
    }
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;