import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", ...fontFamily.sans],
        // or add your own:
        // body: ["Poppins", ...fontFamily.sans],
      },
    },
  },
};
