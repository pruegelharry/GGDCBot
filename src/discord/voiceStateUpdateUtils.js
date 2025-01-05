import { logger } from "../logger.js";
import { getMemberById, updateMember } from "../pocketbase/records/member.js";
import {
  createVoiceChannel,
  getVoiceChannelById,
  updateVoiceChannel,
} from "../pocketbase/records/voiceChannel.js";
import { updateUserExp } from "./utils.js";

const afkChannelId = "918762888297074779";
const createChannelId = "918814111209500703";

const STATE = {
  JOINED: "joined",
  CHANGED: "changed",
  LEFT: "left",
};

export async function handleVoiceStateUpdate(oldState, newState) {
  // returnes for unwanted channels (the createChannel always gets switched to a new one)
  if ([afkChannelId, createChannelId].includes(newState.channel?.id)) return;
  if (!oldState.channel?.id && newState.channel?.id) {
    logger.info(
      `User ${newState?.member?.displayName} joined the channel ${newState?.channel?.name}`
    );
    await handleJoinChannelEvent(oldState, newState);
  }
  if (
    oldState.channel?.id &&
    newState.channel?.id &&
    oldState.channel?.id !== newState.channel?.id
  ) {
    logger.info(
      `User ${newState?.member?.displayName} switched from the channel ${oldState?.channel?.name} to the channel ${newState?.channel?.name}`
    );
    await handleChangeChannelEvent(oldState, newState);
  }
  if (oldState.channel?.id && !newState.channel?.id) {
    logger.info(
      `User ${oldState?.member?.displayName} left the channel ${oldState?.channel?.name}`
    );
    await handleLeaveChannelEvent(oldState, newState);
  }
}

async function handleJoinChannelEvent(oldState, newState) {
  const enteredChannel = new Date(); // register Date here since DB queries might take a relative long time
  await joinNewChannel(newState).catch((err) =>
    logger.error("handleJoinChannelEvent_joinNewChannel", err)
  );
  return updateMember(newState.member.id, {
    enteredChannel,
  });
}

async function handleChangeChannelEvent(oldState, newState) {
  const { id, displayName } = newState.member;
  const { totalTime, activeTime } = await getNewTotalTime(id).catch((err) =>
    logger.error("handleChangeChannelEvent_getNewTotalTime", err)
  );
  // muss nicht zwangsweise awaited werden dann gehts schneller lol
  await leaveOldChannel(oldState).catch((err) =>
    logger.error("handleChangeChannelEvent_leaveOldChannel", err)
  );
  await joinNewChannel(newState).catch((err) =>
    logger.error("handleChangeChannelEvent_joinNewChannel", err)
  );
  // x * 0.005 gleich wie 5 * x / 1000
  await updateUserExp(id, displayName, calculateXp(activeTime)).catch((err) =>
    logger.error("handleChangeChannelEvent_updateUserExp", err)
  );
  return updateMember(id, {
    enteredChannel: new Date(),
    totalTime,
  });
}

async function handleLeaveChannelEvent(oldState, newState) {
  const { id, displayName } = newState.member;
  const { totalTime, activeTime } = await getNewTotalTime(id).catch((err) =>
    logger.error("handleLeaveChannelEvent_getNewTotalTime", err)
  );
  // muss nicht zwangsweise awaited werden dann gehts schneller lol
  await leaveOldChannel(oldState).catch((err) =>
    logger.error("handleLeaveChannelEvent_leaveOldChannel", err)
  );
  // x * 0.005 gleich wie 5 * x / 1000
  await updateUserExp(id, displayName, calculateXp(activeTime)).catch((err) =>
    logger.error("handleLeaveChannelEvent_updateUserExp", err)
  );
  return updateMember(id, {
    leftChannel: new Date(),
    totalTime,
  });
}

async function leaveOldChannel(oldState) {
  const vc = await getVoiceChannelById(oldState.channel.id).catch((err) =>
    logger.error("leaveOldChannel_getVoiceChannelById", err)
  );
  if (!vc) return;
  return updateVoiceChannel(oldState.channel.id, {
    members: vc.members.filter((mb) => mb !== oldState.member.id),
  });
}

async function joinNewChannel(newState) {
  const vc = await getVoiceChannelById(newState.channel.id);
  if (vc) {
    let vcMembers = [...vc.members, newState.member.id];
    if (vc.members.length < newState.channel.members.size) {
      vcMembers = newState.channel.members.map((_, key) => key);
    }
    return updateVoiceChannel(newState.channel.id, {
      members: vcMembers,
    });
  }
  // initiates all current members of the channel
  const members = newState.channel.members.map((_, key) => key);
  return createVoiceChannel(newState.channel.id, {
    name: newState.channel.name,
    members,
  });
}

async function getNewTotalTime(id) {
  const { totalTime, enteredChannel } = await getMemberById(id).catch((err) =>
    logger.error("getNewTotalTime_getMemberById", err)
  );
  const activeTime = Date.now() - new Date(enteredChannel).getTime();
  return {
    totalTime: totalTime + activeTime,
    activeTime,
  };
}

function calculateXp(activeTime) {
  return Math.floor(activeTime / 60 / 1000) * 1;
}
