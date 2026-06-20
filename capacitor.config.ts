import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.galene.ios",
  appName: "Galene",
  webDir: "out", // next build + next export output directory
  server: {
    // Remove this block in production; keep only for local dev hot-reload
    // url: "http://YOUR_LOCAL_IP:3000",
    // cleartext: true,
  },
  ios: {
    contentInset: "automatic", // respect safe areas (notch, home bar)
    backgroundColor: "#FAF3EE",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
