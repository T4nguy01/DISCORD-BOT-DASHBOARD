require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, DEPLOY_GLOBAL } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || (!GUILD_ID && DEPLOY_GLOBAL !== "true")) {
  throw new Error("DISCORD_TOKEN, CLIENT_ID et GUILD_ID (si pas global) sont obligatoires dans .env");
}

const isGlobal = DEPLOY_GLOBAL === "true";
const commands = [];
const commandsPath = path.join(__dirname, "../src/commands");
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command) commands.push(command.data.toJSON());
}

const rest = new REST().setToken(DISCORD_TOKEN);

(async () => {
  try {
    const route = isGlobal
      ? Routes.applicationCommands(CLIENT_ID)
      : Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID);

    const target = isGlobal ? "globalement" : `sur le serveur ${GUILD_ID}`;
    console.log(`Enregistrement de ${commands.length} commande(s) ${target}...`);

    await rest.put(route, { body: commands });

    console.log(`Commandes slash déployées avec succès ${isGlobal ? "globalement (propagation ~1h)" : "instantanément sur le serveur"}.`);
  } catch (error) {
    console.error(error);
  }
})();

