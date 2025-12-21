const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ["class"],
  content: [],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'SF Pro Display'", "'Inter'", ...fontFamily.sans]
      },
      colors: {
        surface: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.16)"
        },
        border: {
          subtle: "rgba(255,255,255,0.12)"
        }
      },
      backdropBlur: {
        xs: "6px"
      },
      boxShadow: {
        glass: "0 20px 60px rgba(0,0,0,0.3)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography"), require("tailwindcss-animate")]
};
