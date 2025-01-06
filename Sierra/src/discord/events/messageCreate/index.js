import { Events } from "discord.js";
import { client } from "../../index.js";
import { handleNewMessageExp } from "../../utils.js";

client.on(Events.MessageCreate, async (message) =>
  handleNewMessageExp(message)
);
