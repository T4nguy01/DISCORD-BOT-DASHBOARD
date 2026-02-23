const { Events } = require("discord.js");
const configStore = require("../config-store");

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const config = configStore.getGuildConfig(member.guild.id);

        if (config.autoRoleEnabled && config.autoRoleId) {
            try {
                const role = member.guild.roles.cache.get(config.autoRoleId);
                if (role) {
                    await member.roles.add(role, "Autorole lors de l'arrivée");
                }
            } catch (error) {
                console.error(`[Autorole] Erreur lors de l'attribution du rôle à ${member.user.tag}:`, error.message);
            }
        }
    },
};
