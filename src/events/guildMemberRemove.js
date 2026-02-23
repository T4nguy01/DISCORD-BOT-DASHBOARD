const { Events, EmbedBuilder } = require("discord.js");
const { getGuildConfig } = require("../core/config-store");

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const { guild, user } = member;
        const cfg = getGuildConfig(guild.id);
        if (!cfg.byeChannel) return;

        const channel = guild.channels.cache.get(cfg.byeChannel);
        if (!channel?.isTextBased()) return;

        const joinedAt = member.joinedTimestamp
            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`
            : "Inconnue";

        const embed = new EmbedBuilder()
            .setColor(0xf04e6a)
            .setTitle(`👋 Au revoir !`)
            .setDescription(`**${user.tag}** a quitté le serveur. On ne l'oubliera pas !`)
            .setThumbnail(user.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: "👤 Utilisateur", value: `${user.tag}`, inline: true },
                { name: "🆔 ID", value: user.id, inline: true },
                { name: "📥 Avait rejoint", value: joinedAt, inline: true },
                { name: "👥 Membres restants", value: `**${guild.memberCount}**`, inline: true }
            )
            .setFooter({ text: guild.name, iconURL: guild.iconURL() })
            .setTimestamp();

        await channel.send({ embeds: [embed] });
    },
};
