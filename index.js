require("dotenv").config();
const cron = require("node-cron");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const { startDashboard } = require("./dashboard-server");
const { isCommandEnabled } = require("./config-store");
const telemetry = require("./telemetry");
const { recordActivity } = require("./xp-store");
const { syncMemberRoles, syncAllGuildMembers } = require("./utils/activity-guard");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

// ── Load commands ───────────────────────────────────────────────────────────
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (!command.data || !command.execute) {
    console.warn(`[WARNING] Skip ${file}: Missing data or execute.`);
    continue;
  }
  client.commands.set(command.data.name, command);
}

// ── Load events ─────────────────────────────────────────────────────────────
const eventsPath = path.join(__dirname, "events");
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    const binder = event.once ? client.once : client.on;
    binder.call(client, event.name, (...args) => event.execute(...args));
  }
}

// ── Ready ────────────────────────────────────────────────────────────────────
client.once(Events.ClientReady, (readyClient) => {
  telemetry.recordSystem("bot_ready", readyClient.user.tag);
  console.log(`✅ Connecté en tant que ${readyClient.user.tag}`);
  console.log(`📦 ${client.commands.size} commande(s) chargée(s)`);

  // -- Initialize WPlace Services --

  // -- Schedule Activity Role Sync (Daily at 4 AM) --
  cron.schedule("0 4 * * *", () => {
    console.log("[Cron] Starting daily activity role sync...");
    readyClient.guilds.cache.forEach(guild => syncAllGuildMembers(guild));
  });
});

// ── Slash command handler ─────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  if (interaction.guildId && !isCommandEnabled(interaction.guildId, interaction.commandName)) {
    telemetry.recordCommand(interaction, "blocked", "Disabled by dashboard");
    return interaction.reply({
      content: `⚠️ La commande \`/${interaction.commandName}\` est désactivée sur ce serveur.`,
      ephemeral: true,
    });
  }

  try {
    await command.execute(interaction);
    recordActivity(interaction.guildId, interaction.user.id);
    if (interaction.member) await syncMemberRoles(interaction.member).catch(() => { });
    telemetry.recordCommand(interaction, "success");
  } catch (error) {
    console.error(`[ERROR] /${interaction.commandName}:`, error);
    telemetry.recordCommand(interaction, "error", error?.message || "Unknown error");
    const payload = { content: "Une erreur s'est produite lors de l'exécution de la commande.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => { });
    } else {
      await interaction.reply(payload).catch(() => { });
    }
  }
});

if (!process.env.DISCORD_TOKEN) {
  throw new Error("DISCORD_TOKEN manquant dans .env");
}

startDashboard(client);
client.login(process.env.DISCORD_TOKEN);
