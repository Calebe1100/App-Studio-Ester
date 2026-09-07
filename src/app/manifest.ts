import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Studio Ester",
    short_name: "Ester",
    description: "Agenda e gestão do salão",
    start_url: "/login",
    display: "standalone",
    background_color: "#f6f0e7",
    theme_color: "#7a3144",
    lang: "pt-BR",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
