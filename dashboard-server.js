const path = require("node:path");
const express = require("express");
const { ChannelType } = require("discord.js");
const configStore = require("./config-store");
const telemetry = require("./telemetry");

function isGuildId(value) {
  return /^\d{17,20}$/.test(String(value || ""));
}

async function getGuildStats(guild) {
  let members = [];
  let fullFetch = true;

  try {
    const fetched = await guild.members.fetch();
    members = [...fetched.values()];
  } catch {
    fullFetch = false;
    members = [...guild.members.cache.values()];
  }

  const humans = members.filter((m) => !m.user.bot).length;
  const bots = members.filter((m) => m.user.bot).length;
  const roles = [...guild.roles.cache.values()].filter((r) => r.id !== guild.id);
  const membersWithoutRole = members.filter((m) => m.roles.cache.size <= 1).length;
  const topRoles = roles
    .map((role) => ({ roleId: role.id, roleName: role.name, count: role.members.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return {
    guildId: guild.id,
    guildName: guild.name,
    ownerId: guild.ownerId,
    createdAt: guild.createdAt.toISOString(),
    memberCount: guild.memberCount,
    humans,
    bots,
    roleCount: roles.length,
    membersWithoutRole,
    topRoles,
    partialData: !fullFetch,
  };
}

function startDashboard(client) {
  const app = express();
  const port = Number(process.env.DASHBOARD_PORT || 3000);
  const requiredApiKey = process.env.DASHBOARD_API_KEY || "";

  app.use(express.json());
  app.use(express.static(path.join(__dirname, "dashboard")));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Auth Middleware
  // Auth Middleware (Disabled by user request)
  app.use("/api", (req, res, next) => {
    next();
  });


  app.get("/api/guilds", (_req, res) => {
    const guilds = [...client.guilds.cache.values()]
      .map((guild) => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json({ guilds });
  });

  app.get("/api/command-config/:guildId", (req, res) => {
    const guildId = req.params.guildId;
    if (!isGuildId(guildId)) {
      return res.status(400).json({ error: "Invalid guildId." });
    }

    const commandNames = [...client.commands.keys()].sort((a, b) => a.localeCompare(b));
    const states = configStore.getCommandStates(guildId, commandNames);
    const commands = commandNames.map((name) => {
      const cmd = client.commands.get(name);
      return {
        name,
        enabled: Boolean(states[name]),
        category: cmd?.category || "Sans catégorie"
      };
    });

    return res.json({ guildId, commands });
  });

  app.get("/api/guild-stats/:guildId", async (req, res) => {
    const guildId = req.params.guildId;
    if (!isGuildId(guildId)) {
      return res.status(400).json({ error: "Invalid guildId." });
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      return res.status(404).json({ error: "Guild not found in bot cache." });
    }

    const stats = await getGuildStats(guild);
    return res.json({ stats });
  });

  app.post("/api/command-config/:guildId", (req, res) => {
    const guildId = req.params.guildId;
    if (!isGuildId(guildId)) {
      return res.status(400).json({ error: "Invalid guildId." });
    }

    const commands = Array.isArray(req.body?.commands) ? req.body.commands : null;
    if (!commands) {
      return res.status(400).json({ error: "commands[] is required." });
    }

    const commandStates = {};
    for (const command of commands) {
      const name = String(command?.name || "").trim().toLowerCase();
      if (!name) continue;
      commandStates[name] = Boolean(command?.enabled);
    }

    configStore.updateCommandStates(guildId, commandStates);

    const commandNames = [...client.commands.keys()].sort((a, b) => a.localeCompare(b));
    const states = configStore.getCommandStates(guildId, commandNames);
    const response = commandNames.map((name) => ({ name, enabled: Boolean(states[name]) }));
    return res.json({ ok: true, guildId, commands: response });
  });

  app.get("/api/bot/summary", (_req, res) => {
    res.json({ summary: telemetry.getSummary(client) });
  });

  app.get("/api/guild-channels/:guildId", async (req, res) => {
    const guildId = req.params.guildId;
    if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: "Guild not found." });

    const channels = guild.channels.cache
      .filter(c => c.type === 0) // TextChannel
      .map(c => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ channels });
  });

  app.get("/api/guild-roles/:guildId", async (req, res) => {
    const guildId = req.params.guildId;
    if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: "Guild not found." });

    const roles = guild.roles.cache
      .filter(r => r.id !== guildId && !r.managed)
      .map(r => ({ id: r.id, name: r.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ roles });
  });

  app.get("/api/guild-categories/:guildId", async (req, res) => {
    const guildId = req.params.guildId;
    if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: "Guild not found." });

    const categories = guild.channels.cache
      .filter(c => c.type === ChannelType.GuildCategory)
      .map(c => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ categories });
  });

  app.get("/api/guild-config/:guildId", (req, res) => {
    const guildId = req.params.guildId;
    if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

    const config = configStore.getGuildConfig(guildId);
    res.json({ guildId, config });
  });

  app.post("/api/guild-config/:guildId", (req, res) => {
    const guildId = req.params.guildId;
    if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

    const config = req.body?.config;
    if (!config || typeof config !== "object") {
      return res.status(400).json({ error: "config object is required." });
    }

    const updated = configStore.updateGuildConfig(guildId, config);
    res.json({ ok: true, guildId, config: updated });
  });

  app.post("/api/announce", async (req, res) => {
    const { guildId, channelId, message } = req.body;
    if (!isGuildId(guildId) || !channelId || !message) {
      return res.status(400).json({ error: "Champs manquants." });
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: "Serveur non trouvé." });

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
      return res.status(400).json({ error: "Salon invalide." });
    }

    try {
      const embed = {
        color: 0x3ecf8e,
        description: message,
        footer: { text: "Annonce via Dashboard" },
        timestamp: new Date().toISOString()
      };
      await channel.send({ embeds: [embed] });
      telemetry.recordSystem("announcement_sent", `Vers ${channel.name} sur ${guild.name}`);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/bot/events", (req, res) => {
    const limit = Number(req.query.limit || 20);
    res.json({ events: telemetry.getRecentEvents(limit) });
  });

  app.listen(port, () => {
    telemetry.recordSystem("dashboard_started", `http://localhost:${port}`);
    console.log(`Dashboard web disponible sur http://localhost:${port}`);
  });
}

module.exports = { startDashboard };
