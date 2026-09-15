import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ana Ester Studio de Beleza",
    short_name: "Ana Ester",
    description: "Agenda do studio de beleza",
    start_url: "/agenda",
    display: "standalone",
    background_color: "#4a1f22",
    theme_color: "#4a1f22",
    lang: "pt-BR",
    icons: [
      {
        src: "/logo_final.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo_final.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
