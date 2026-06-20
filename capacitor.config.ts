import type { CapacitorConfig } from "@capacitor/cli";

// Deployment strategy:
// - This Next.js app uses server-side API routes (/api/delete-account), so it
//   cannot be statically exported (output: 'export').
// - Instead, deploy to Vercel (or any Node host) and set server.url below to
//   point to your production domain. Capacitor will load the live web app in a
//   WKWebView — all API routes and Supabase Realtime connections work normally.
// - For local dev, uncomment the dev url and use your machine's LAN IP.

const PROD_URL = "https://your-galene-vercel-url.vercel.app"; // ← replace this

const config: CapacitorConfig = {
  appId: "app.galene.ios",
  appName: "Galene",
  webDir: "out", // only used when server.url is not set; kept as fallback
  server: {
    url: PROD_URL,
    cleartext: false,
    // For local dev, comment out PROD_URL line above and use:
    // url: "http://192.168.x.x:3000",
    // cleartext: true,
  },
  ios: {
    contentInset: "automatic", // respect safe areas (notch, home bar)
    backgroundColor: "#FAF3EE",
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
