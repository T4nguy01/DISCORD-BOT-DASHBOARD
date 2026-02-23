const configStore = require("../core/config-store");
const telemetry = require("../core/telemetry");
const xpStore = require("../core/xp-store");
const { ChannelType, PermissionsBitField } = require("discord.js");

function isGuildId(value) {
    return /^\d{17,20}$/.test(String(value || ""));
}

async function getStatsForGuild(guild) {
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

module.exports = (client) => ({
    getGuilds: (req, res) => {
        const guilds = [...client.guilds.cache.values()]
            .map((guild) => ({
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        res.json({ guilds });
    },

    getCommandConfig: (req, res) => {
        const { guildId } = req.params;
        if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

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

        res.json({ guildId, commands });
    },

    updateCommandConfig: (req, res) => {
        const { guildId } = req.params;
        if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

        const commands = Array.isArray(req.body?.commands) ? req.body.commands : null;
        if (!commands) return res.status(400).json({ error: "commands[] is required." });

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

        res.json({ ok: true, guildId, commands: response });
    },

    getGuildStats: async (req, res) => {
        const { guildId } = req.params;
        if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Guild not found." });

        const stats = await getStatsForGuild(guild);
        res.json({ stats });
    },

    getBotSummary: (req, res) => {
        const pkg = require("../../package.json");
        res.json({
            summary: telemetry.getSummary(client),
            version: pkg.version
        });
    },

    getChannels: (req, res) => {
        const { guildId } = req.params;
        if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Guild not found." });

        const channels = guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .map(c => ({ id: c.id, name: c.name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        res.json({ channels });
    },

    getRoles: (req, res) => {
        const { guildId } = req.params;
        if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Guild not found." });

        // Get bot's highest role for hierarchy check
        const botMember = guild.members.me;
        const botHighest = botMember.roles.highest.position;

        const roles = guild.roles.cache
            .filter(r => r.id !== guildId && !r.managed)
            .map(r => ({
                id: r.id,
                name: r.name,
                color: r.hexColor,
                position: r.position,
                hoist: r.hoist,
                permissions: Array.from(r.permissions),
                editable: r.position < botHighest && botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)
            }))
            .sort((a, b) => b.position - a.position);

        res.json({ roles });
    },

    createRole: async (req, res) => {
        const { guildId } = req.params;
        const { name, color, hoist } = req.body;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Guild not found." });

        try {
            const role = await guild.roles.create({
                name: name || "Nouveau Rôle",
                color: color || "#99aab5",
                hoist: Boolean(hoist),
                reason: "Créé via Dashboard"
            });
            res.json({ ok: true, role: { id: role.id, name: role.name } });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },

    updateRole: async (req, res) => {
        const { guildId, roleId } = req.params;
        const { name, color, hoist } = req.body;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Guild not found." });

        const role = guild.roles.cache.get(roleId);
        if (!role) return res.status(404).json({ error: "Role not found." });

        try {
            const updated = await role.edit({
                name: name !== undefined ? name : role.name,
                color: color !== undefined ? color : role.color,
                hoist: hoist !== undefined ? Boolean(hoist) : role.hoist,
                reason: "Modifié via Dashboard"
            });
            res.json({ ok: true, role: { id: updated.id, name: updated.name } });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },

    deleteRole: async (req, res) => {
        const { guildId, roleId } = req.params;
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Guild not found." });

        const role = guild.roles.cache.get(roleId);
        if (!role) return res.status(404).json({ error: "Role not found." });

        try {
            await role.delete("Supprimé via Dashboard");
            res.json({ ok: true });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    },

    getLeaderboard: async (req, res) => {
        const { guildId } = req.params;
        if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Guild not found." });

        const rawLeaderboard = xpStore.getLeaderboard(guildId, 50);

        // Enrich with user names/avatars
        const leaderboard = await Promise.all(rawLeaderboard.map(async (entry, index) => {
            try {
                const member = await guild.members.fetch(entry.userId).catch(() => null);
                return {
                    rank: index + 1,
                    userId: entry.userId,
                    name: member ? member.displayName : "Membre parti",
                    avatar: member ? member.user.displayAvatarURL({ size: 64 }) : null,
                    xp: entry.xp,
                    level: entry.level
                };
            } catch {
                return { ...entry, rank: index + 1, name: "Inconnu", avatar: null };
            }
        }));

        res.json({ leaderboard });
    },

    getCategories: (req, res) => {
        const { guildId } = req.params;
        if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return res.status(404).json({ error: "Guild not found." });

        const categories = guild.channels.cache
            .filter(c => c.type === ChannelType.GuildCategory)
            .map(c => ({ id: c.id, name: c.name }))
            .sort((a, b) => a.name.localeCompare(b.name));

        res.json({ categories });
    },

    getConfig: (req, res) => {
        const { guildId } = req.params;
        if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

        const config = configStore.getGuildConfig(guildId);
        res.json({ guildId, config });
    },

    updateConfig: (req, res) => {
        const { guildId } = req.params;
        if (!isGuildId(guildId)) return res.status(400).json({ error: "Invalid guildId." });

        const config = req.body?.config;
        if (!config || typeof config !== "object") {
            return res.status(400).json({ error: "config object is required." });
        }

        const updated = configStore.updateGuildConfig(guildId, config);
        res.json({ ok: true, guildId, config: updated });
    },

    announce: async (req, res) => {
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
    },

    getEvents: (req, res) => {
        const limit = Number(req.query.limit || 20);
        res.json({ events: telemetry.getRecentEvents(limit) });
    }
});
