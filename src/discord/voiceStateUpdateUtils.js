import { updateMember } from "../pocketbase/records/member";
import { createVoiceChannel } from "../pocketbase/records/voiceChannel.js";

const afkChannelId = "918762888297074779";
const createChannelId = "918814111209500703";

const STATE = {
  JOINED: "joined",
  CHANGED: "changed",
  LEFT: "left",
};

export async function handleVoiceStateUpdate(oldState, newState) {
  if (!oldState.channel?.id && newState.channel?.id) {
    handleJoinChannelEvent(oldState, newState);
  }
  if (
    oldState.channel?.id &&
    newState.channel?.id &&
    oldState.channel?.id !== newState.channel?.id
  ) {
    handleChangeChannelEvent(oldState, newState);
  }
  if (oldState.channel?.id && !newState.channel?.id) {
    handleLeaveChannelEvent(oldState, newState);
  }
}

async function handleJoinChannelEvent(oldState, newState) {
  const { time } = await createVoiceChannel(
    newState.channel.id,
    new Date(),
    undefined
  );
  const test = null;
}

async function handleChangeChannelEvent(oldState, newState) {}

async function handleLeaveChannelEvent(oldState, newState) {}
