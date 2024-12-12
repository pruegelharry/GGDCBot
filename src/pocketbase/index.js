const PocketBase = require("pocketbase/cjs");

const pb = new PocketBase("https://pocketbase.jankuepper.de/");
pb.autoCancellation(false);
module.exports = { pb };
