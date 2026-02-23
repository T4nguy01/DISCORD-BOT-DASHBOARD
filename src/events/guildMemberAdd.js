const { Events } = require("discord.js");
const configStore = require("../core/config-store");

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

        if (config.welcomeChannel) {
            const channel = member.guild.channels.cache.get(config.welcomeChannel);
            if (channel?.isTextBased()) {
                let msg = config.welcomeMessage || "Bienvenue {user} sur {guild} !";
                msg = msg.replace("{user}", `<@${member.user.id}>`).replace("{guild}", member.guild.name);
                channel.send(msg).catch(console.error);
            }
        }
    },
};
