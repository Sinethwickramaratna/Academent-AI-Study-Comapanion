import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-fixed": "#eaddff",
        "surface-container-low": "#eff4ff",
        "on-tertiary-fixed": "#281800",
        "on-primary-fixed-variant": "#533293",
        "on-error-container": "#93000a",
        "on-secondary": "#ffffff",
        "outline": "#7b7582",
        "on-error": "#ffffff",
        "tertiary-container": "#593a00",
        "on-tertiary": "#ffffff",
        "inverse-surface": "#27313f",
        "inverse-on-surface": "#eaf1ff",
        "outline-variant": "#cbc3d3",
        "error-container": "#ffdad6",
        "error": "#ba1a1a",
        "tertiary-fixed-dim": "#ffba47",
        "primary-container": "#4d2b8c",
        "on-background": "#121c2a",
        "surface-container": "#e6eeff",
        "surface-container-highest": "#d9e3f6",
        "surface-container-high": "#dee9fc",
        "tertiary-fixed": "#ffddb0",
        "tertiary": "#3c2600",
        "surface-variant": "#d9e3f6",
        "on-secondary-fixed-variant": "#6b2784",
        "surface-dim": "#d0dbed",
        "surface-bright": "#f8f9ff",
        "on-primary": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-container": "#e49f1d",
        "on-surface": "#121c2a",
        "secondary-container": "#e699fd",
        "on-primary-fixed": "#25005a",
        "on-tertiary-fixed-variant": "#614000",
        "on-secondary-fixed": "#330045",
        "background": "#f8f9ff",
        "on-secondary-container": "#6c2784",
        "inverse-primary": "#d2bbff",
        "primary": "#360d75",
        "surface": "#f8f9ff",
        "secondary-fixed-dim": "#eeb0ff",
        "surface-tint": "#6c4bac",
        "secondary": "#86419e",
        "secondary-fixed": "#fad7ff",
        "primary-fixed-dim": "#d2bbff",
        "on-surface-variant": "#4a4551",
        "on-primary-container": "#bc9bff"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "12px",
        "2xl": "16px",
        "3xl": "20px",
        "full": "9999px"
      },
      spacing: {
        "gutter": "24px",
        "margin-mobile": "20px",
        "lg": "24px",
        "margin-desktop": "40px",
        "xl": "32px",
        "xxl": "48px",
        "md": "16px",
        "unit": "8px",
        "xs": "4px",
        "container-max": "1280px",
        "sm": "8px"
      },
      fontFamily: {
        "label-sm": ["Inter"],
        "label-md": ["Inter"],
        "headline-md": ["Hanken Grotesk"],
        "headline-lg": ["Hanken Grotesk"],
        "display-lg": ["Hanken Grotesk"],
        "body-md": ["Inter"],
        "body-lg": ["Inter"]
      },
      fontSize: {
        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.01em", "fontWeight": "600" }],
        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "500" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "600" }],
        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "display-lg-mobile": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }]
      }
    },
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
