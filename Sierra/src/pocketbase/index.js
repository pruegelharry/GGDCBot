import PocketBase from "pocketbase";

export const pb = new PocketBase("https://pocketbase.jankuepper.de/");

export function initializePoketBase(token) {
  pb.autoCancellation(false);
  pb.authStore.save(token, null);
}
