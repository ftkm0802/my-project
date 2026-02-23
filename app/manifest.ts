import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "BC AI-Gram",
        short_name: "BC AI-Gram",
        description: "BLUE CORAL Instagram自動運用ダッシュボード",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#3b82f6",
        icons: [
            {
                src: "/icon",
                sizes: "512x512",
                type: "image/png",
            },
            {
                src: "/apple-icon",
                sizes: "180x180",
                type: "image/png",
            },
        ],
    };
}
