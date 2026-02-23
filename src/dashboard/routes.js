const express = require("express");
const router = express.Router();

module.exports = (ctrl) => {
    router.get("/health", (req, res) => res.json({ ok: true }));
    router.get("/guilds", ctrl.getGuilds);
    router.get("/command-config/:guildId", ctrl.getCommandConfig);
    router.post("/command-config/:guildId", ctrl.updateCommandConfig);
    router.get("/guild-stats/:guildId", ctrl.getGuildStats);
    router.get("/bot/summary", ctrl.getBotSummary);
    router.get("/guild-channels/:guildId", ctrl.getChannels);
    router.get("/guild-roles/:guildId", ctrl.getRoles);
    router.post("/guild-roles/:guildId", ctrl.createRole);
    router.patch("/guild-roles/:guildId/:roleId", ctrl.updateRole);
    router.delete("/guild-roles/:guildId/:roleId", ctrl.deleteRole);
    router.get("/guild-leaderboard/:guildId", ctrl.getLeaderboard);

    router.get("/guild-categories/:guildId", ctrl.getCategories);
    router.get("/guild-config/:guildId", ctrl.getConfig);
    router.post("/guild-config/:guildId", ctrl.updateConfig);
    router.post("/announce", ctrl.announce);
    router.get("/bot/events", ctrl.getEvents);

    return router;
};
