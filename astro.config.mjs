// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
  integrations: [preact()],
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
