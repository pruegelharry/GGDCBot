import { guildId } from "./index.js";
import { logger } from "./logger.js";
import { pb } from "./pocketbase/index.js";
import { addNewMember, getAllMembers } from "./pocketbase/records/member.js";
import { getAllRanks, setDiscordId } from "./pocketbase/records/rank.js";

export async function initializeRankIds(client) {
  const ranks = await getAllRanks();
  const ranksWithMissingIds = ranks.filter((rank) => !rank.discordId);
  if (ranksWithMissingIds) {
    const guild = await client.guilds.fetch(guildId);
    const roles = await guild.roles.fetch();
    ranksWithMissingIds.forEach(async (rank) => {
      roles.forEach(async (role) => {
        if (rank.name === role.name) {
          setDiscordId(rank.id, role.id);
        }
      });
    });
  }
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
        (pbMember) => pbMember.discordId !== dcMember.id
      );
      if (!foundPbMember) {
        promises.push(addNewMember(dcMember.id));
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
