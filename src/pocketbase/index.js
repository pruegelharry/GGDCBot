import PocketBase from "pocketbase";

export const pb = new PocketBase("https://pocketbase.jankuepper.de/");
pb.autoCancellation(false);
