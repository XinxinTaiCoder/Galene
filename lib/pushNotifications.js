import { supabase } from "./supabase";

// Lazy-import Capacitor plugins — they throw in a browser / SSR context
async function getPlugin() {
  try {
    const { PushNotifications } = await import("@capacitor/push-notifications");
    return PushNotifications;
  } catch {
    return null;
  }
}

/**
 * Request push permission and register the device token with Supabase.
 * Call this once after the user is authenticated (userId is known).
 * No-ops gracefully in a plain browser or SSR context.
 */
export async function registerPushNotifications(userId) {
  const PushNotifications = await getPlugin();
  if (!PushNotifications) return; // web / dev — skip silently

  try {
    const { receive: permResult } = await PushNotifications.checkPermissions();

    let status = permResult;
    if (status === "prompt") {
      const { receive } = await PushNotifications.requestPermissions();
      status = receive;
    }
    if (status !== "granted") return;

    // Remove stale listeners before re-registering
    await PushNotifications.removeAllListeners();

    await PushNotifications.addListener("registration", async ({ value: token }) => {
      if (!token || !userId) return;
      try {
        await supabase.from("push_tokens").upsert(
          { user_id: userId, token, platform: "ios", updated_at: new Date().toISOString() },
          { onConflict: "token" }
        );
      } catch (err) {
        console.error("Push token upsert error:", err?.message);
      }
    });

    await PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err?.error);
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      // App is in foreground — the in-app bell already handles this via Realtime
      console.log("Push received (foreground):", notification?.title);
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      // User tapped notification while app was backgrounded / closed
      const data = action?.notification?.data || {};
      if (typeof window !== "undefined" && data.type) {
        // Dispatch a custom event; NuanyuApp listens for this to deep-link
        window.dispatchEvent(new CustomEvent("galene:push-tap", { detail: data }));
      }
    });

    await PushNotifications.register();
  } catch (err) {
    console.error("Push setup error:", err?.message);
  }
}

export async function unregisterPushToken(userId) {
  if (typeof window === "undefined") return;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;
    const { PushNotifications } = await import("@capacitor/push-notifications");
    await PushNotifications.removeAllListeners();
    await supabase.from("push_tokens").delete().eq("user_id", userId);
  } catch (err) {
    console.error("Push unregister error:", err?.message);
  }
}
