// @ts-check
import { defineConfig, fontProviders } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://chrisparsons.dev",
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Open Sans",
      cssVariable: "--font-open-sans",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/OpenSans-VariableFont_wdth,wght.ttf"],
            weight: "normal",
            style: "normal",
          },
        ],
      },
      fallbacks: ["sans-serif"],
    },
  ],
});
