import { logger } from "../../logger.js";
import { pb } from "../index.js";

export async function createVoiceChannel(id, args) {
  return pb.collection("voicechannel").create({
    id,
    ...args,
  }).catch(
    (err) => (err.status === 404 ? undefined : err) // can be ignored since we know the channel might not yet exist
  );
}

export async function getVoiceChannelById(id) {
  return pb
    .collection("voicechannel")
    .getOne(id)
    .catch(
      (err) => (err.status === 404 ? undefined : err) // can be ignored since we know the channel might not yet exist
    );
}

export async function updateVoiceChannel(id, args) {
  return pb.collection("voicechannel").update(id, args).catch(
    (err) => (err.status === 404 ? undefined : err) // can be ignored since we know the channel might not yet exist
  );
}
