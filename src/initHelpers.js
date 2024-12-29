import { guildId } from "./index.js";
import { logger } from "./logger.js";
import {
  addNewMember,
  getAllMembers,
  updateMember,
} from "./pocketbase/records/member.js";
import {
  createRank,
  getAllRanks,
  getRankById,
  updateRank,
} from "./pocketbase/records/rank.js";
import {
  createVoiceChannel,
  getVoiceChannelById,
  updateVoiceChannel,
} from "./pocketbase/records/voiceChannel.js";

export async function initializeRankIds(client) {
  const rankThresholds = [
    { role: "Plastik", minExp: 0, maxExp: 99 },
    { role: "Eisen", minExp: 100, maxExp: 499 },
    { role: "Kupfer", minExp: 500, maxExp: 999 },
    { role: "Silber", minExp: 1000, maxExp: 2499 },
    { role: "Gold", minExp: 2500, maxExp: 4999 },
    { role: "Platin", minExp: 5000, maxExp: 9999 },
    { role: "Diamand", minExp: 10000, maxExp: 14999 },
    { role: "Master", minExp: 15000, maxExp: 19999 },
    { role: "Legende", minExp: 20000, maxExp: 29999 },
    { role: "Champion", minExp: 30000, maxExp: 10000000 },
  ];
  const guild = await client.guilds.fetch(guildId);
  const roles = await guild.roles.fetch();
  rankThresholds.forEach(async (rank) => {
    const role = roles.find((role) => role.name === rank.role);
    if (role) {
      const existingRole = await getRankById(role.id);
      if (existingRole) {
        updateRank(role.id, {
          name: role.name,
          minimum: rank.minExp,
          maximum: rank.maxExp,
        });
      } else {
        createRank(role.id, role.name, rank.minExp, rank.maxExp);
      }
    }
  });
}

export async function initializeMembers(client) {
  const pbMembers = await getAllMembers();
  const guild = await client.guilds.fetch(guildId);
  const members = await guild.members.fetch();
  const nonBots = members.filter((member) => !member.user.bot);
  if (nonBots.size !== pbMembers.length) {
    const promises = [];
    members.forEach((dcMember) => {
      const foundPbMember = pbMembers.find(
        (pbMember) => pbMember.id === dcMember.id
      );
      if (!foundPbMember) {
        promises.push(addNewMember(dcMember.id, dcMember.displayName));
      }
      if (foundPbMember && foundPbMember.displayName === "") {
        promises.push(
          updateMember(foundPbMember.id, {
            displayName: dcMember.displayName,
          })
        );
      }
    });
    try {
      await Promise.all(promises);
    } catch (err) {
      logger.error(
        `Initializing missing members failed with the error: ${err}`
      );
    }
  }
}

export async function initVoiceChannels(client) {
  const guild = await client.guilds.fetch(guildId);
  const members = await guild.members.fetch();
  // kann ausgetauscht werden mit der logik aus joinChannel()
  members.each(async (member) => {
    if (member?.voice?.channel) {
      updateMember(member.id, {
        enteredChannel: new Date(),
      });
      const vc = await getVoiceChannelById(member.voice.channelId);
      if (vc) {
        return updateVoiceChannel(member.voice.channelId, {
          members: member.voice.channel.members.map((_, key) => key),
        }).catch((e) =>
          logger.error("initVoiceChannels_updateVoiceChannel", e)
        );
      }
      return createVoiceChannel(member.voice.channelId, {
        members: member.voice.channel.members.map((_, key) => key),
      }).catch((e) => logger.error("initVoiceChannels_createVoiceChannel", e));
    }
  });
}
