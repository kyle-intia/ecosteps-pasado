import { pushSubscribe } from "../lib/api";

export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function subscribeToPush(userId) {
  const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  try {
    if (Notification.permission === "denied") {
      console.error("Notifications are denied by the user.");
      return false;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("User denied notification permission.");
        return false;
      }
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    const swRegistration = await navigator.serviceWorker.ready;

    const existingSubscription =
      await swRegistration.pushManager.getSubscription();

    let subscription;
    if (existingSubscription) {
      subscription = existingSubscription;
    } else {
      subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await pushSubscribe(userId, subscription);

    return true;
  } catch (error) {
    console.error("Push subscription failed:", error?.message || error);
    return false;
  }
}
