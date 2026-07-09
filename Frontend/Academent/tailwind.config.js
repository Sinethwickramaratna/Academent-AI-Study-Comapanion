import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

const colorVar = (name) => ({ opacityValue }) => (
  opacityValue === undefined
    ? `rgb(var(--color-${name}))`
    : `rgb(var(--color-${name}) / ${opacityValue})`
);

const themeColors = {
  "primary-fixed": "primary-fixed",
  "surface-container-low": "surface-container-low",
  "on-tertiary-fixed": "on-tertiary-fixed",
  "on-primary-fixed-variant": "on-primary-fixed-variant",
  "on-error-container": "on-error-container",
  "on-secondary": "on-secondary",
  "outline": "outline",
  "on-error": "on-error",
  "tertiary-container": "tertiary-container",
  "on-tertiary": "on-tertiary",
  "inverse-surface": "inverse-surface",
  "inverse-on-surface": "inverse-on-surface",
  "outline-variant": "outline-variant",
  "error-container": "error-container",
  "error": "error",
  "tertiary-fixed-dim": "tertiary-fixed-dim",
  "primary-container": "primary-container",
  "on-background": "on-background",
  "surface-container": "surface-container",
  "surface-container-highest": "surface-container-highest",
  "surface-container-high": "surface-container-high",
  "tertiary-fixed": "tertiary-fixed",
  "tertiary": "tertiary",
  "surface-variant": "surface-variant",
  "on-secondary-fixed-variant": "on-secondary-fixed-variant",
  "surface-dim": "surface-dim",
  "surface-bright": "surface-bright",
  "on-primary": "on-primary",
  "surface-container-lowest": "surface-container-lowest",
  "on-tertiary-container": "on-tertiary-container",
  "on-surface": "on-surface",
  "secondary-container": "secondary-container",
  "on-primary-fixed": "on-primary-fixed",
  "on-tertiary-fixed-variant": "on-tertiary-fixed-variant",
  "on-secondary-fixed": "on-secondary-fixed",
  "background": "background",
  "on-secondary-container": "on-secondary-container",
  "inverse-primary": "inverse-primary",
  "primary": "primary",
  "surface": "surface",
  "secondary-fixed-dim": "secondary-fixed-dim",
  "surface-tint": "surface-tint",
  "secondary": "secondary",
  "secondary-fixed": "secondary-fixed",
  "primary-fixed-dim": "primary-fixed-dim",
  "on-surface-variant": "on-surface-variant",
  "on-primary-container": "on-primary-container",
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: Object.fromEntries(
        Object.entries(themeColors).map(([key, variableName]) => [key, colorVar(variableName)])
      ),
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