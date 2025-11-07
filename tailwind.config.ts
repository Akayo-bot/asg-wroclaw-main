import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default {
    darkMode: ["class"],
    content: [
        "./src/**/*.{ts,tsx}",
        "./src/pages/**/*.{ts,tsx}",
        "./src/components/**/*.{ts,tsx}",
        "./src/pages/admin/**/*.{ts,tsx}",
        "./src/components/admin/**/*.{ts,tsx}",
        "./src/components/auth/**/*.{ts,tsx}",
        "./src/components/ui/**/*.{ts,tsx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            // Custom text shadows for neon-like headings
            textShadow: {
                red: "0 0 10px rgba(239, 68, 68, 0.5)",
                green: "0 0 10px rgba(52, 211, 153, 0.5)",
                blue: "0 0 10px rgba(96, 165, 250, 0.5)",
            },
            fontFamily: {
                'sans': ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                'display': ['Tektur', 'Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                'rajdhani': ['Rajdhani', 'sans-serif'],
                'montserrat': ['Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                'gilroy': ['Gilroy', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                'tektur': ['Tektur', 'Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    glow: "hsl(var(--primary-glow))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                    glow: "hsl(var(--danger-glow))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                glass: {
                    DEFAULT: "hsla(var(--glass))",
                    border: "hsl(var(--glass-border))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
                // Новая цветовая палитра
                teal: {
                    DEFAULT: "#46D6C8",
                    50: "rgba(70, 214, 200, 0.05)",
                    100: "rgba(70, 214, 200, 0.1)",
                    200: "rgba(70, 214, 200, 0.2)",
                    300: "#46D6C8",
                    400: "#46D6C8",
                    500: "#46D6C8",
                },
                orange: {
                    DEFAULT: "#FF7F3B",
                    50: "rgba(255, 127, 59, 0.05)",
                    100: "rgba(255, 127, 59, 0.1)",
                    200: "rgba(255, 127, 59, 0.2)",
                    300: "#FF7F3B",
                    400: "#FF7F3B",
                    500: "#FF7F3B",
                },
                yellow: {
                    DEFAULT: "#FFC46B",
                    50: "rgba(255, 196, 107, 0.05)",
                    100: "rgba(255, 196, 107, 0.1)",
                    200: "rgba(255, 196, 107, 0.2)",
                    300: "#FFC46B",
                    400: "#FFC46B",
                    500: "#FFC46B",
                },
                purple: {
                    DEFAULT: "#A020F0",
                    50: "rgba(160, 32, 240, 0.05)",
                    100: "rgba(160, 32, 240, 0.1)",
                    200: "rgba(160, 32, 240, 0.2)",
                    300: "rgba(160, 32, 240, 0.3)",
                    400: "#A020F0",
                    500: "#A020F0",
                },
                gray: {
                    DEFAULT: "#808080",
                    50: "rgba(128, 128, 128, 0.05)",
                    100: "rgba(128, 128, 128, 0.1)",
                    200: "rgba(128, 128, 128, 0.2)",
                    300: "rgba(128, 128, 128, 0.3)",
                    400: "#808080",
                    500: "#808080",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: {
                        height: "0",
                    },
                    to: {
                        height: "var(--radix-accordion-content-height)",
                    },
                },
                "accordion-up": {
                    from: {
                        height: "var(--radix-accordion-content-height)",
                    },
                    to: {
                        height: "0",
                    },
                },
                "pulse-soft": {
                    "0%, 100%": {
                        boxShadow: "0 0 20px rgba(16, 185, 129, 0.22), inset 0 0 12px rgba(16, 185, 129, 0.14)",
                    },
                    "50%": {
                        boxShadow: "0 0 28px rgba(16, 185, 129, 0.34), inset 0 0 14px rgba(16, 185, 129, 0.18)",
                    },
                },
                "pulse-deep": {
                    "0%, 100%": {
                        opacity: "0.1",
                        boxShadow: "inset 0 0 30px rgba(16, 185, 129, 0.25), inset 0 0 15px rgba(52, 211, 153, 0.15)",
                    },
                    "50%": {
                        opacity: "0.6",
                        boxShadow: "inset 0 0 50px rgba(16, 185, 129, 0.45), inset 0 0 30px rgba(52, 211, 153, 0.3)",
                    },
                },
                "neon-pulse": {
                    "0%, 100%": {
                        boxShadow: "0 0 8px rgba(52, 211, 153, 0.4), inset 0 0 3px rgba(52, 211, 153, 0.3)",
                        opacity: "0.9",
                    },
                    "50%": {
                        boxShadow: "0 0 16px rgba(52, 211, 153, 0.7), inset 0 0 5px rgba(52, 211, 153, 0.5)",
                        opacity: "1",
                    },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "smoke-drift": "smoke-drift 3s ease-in-out infinite",
                "tactical-pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "glow-pulse": "glow-pulse 2s ease-in-out infinite alternate",
                "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
                "pulse-deep": "pulse-deep 2.4s ease-in-out infinite",
                "neon-pulse": "neon-pulse 3s infinite alternate",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            boxShadow: {
                'tactical': 'var(--tactical-shadow)',
                'glow-primary': 'var(--glow-primary)',
                'glow-danger': 'var(--glow-danger)',
            },
            backdropBlur: {
                'glass': '12px',
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        require("@tailwindcss/typography"),
        // text-shadow utilities
        plugin(function ({ matchUtilities, theme }) {
            matchUtilities(
                { "text-shadow": (value: string) => ({ textShadow: value }) },
                { values: (theme as any)("textShadow") }
            );
        }),
    ],
} satisfies Config;
