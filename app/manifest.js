export default function manifest() {
  return {
    name: "Galene · 宁静之海",
    short_name: "Galene",
    description: "A safe space for women to share, support, and connect anonymously.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF3EC",
    theme_color: "#C9755A",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
