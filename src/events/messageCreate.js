const { Events, EmbedBuilder } = require("discord.js");
const xpStore = require("../core/xp-store");
const { getGuildConfig } = require("../core/config-store");
const { syncMemberRoles } = require("../utils/activity-guard");

// XP gained per message: random between 15 and 25
const XP_MIN = 15;
const XP_MAX = 25;

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || !message.guild || !message.content) return;

        const amount = Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN;
        const result = xpStore.addXp(message.guild.id, message.author.id, amount);
        if (!result || result.newLevel <= result.oldLevel) return;

        const cfg = getGuildConfig(message.guild.id);
        let targetChannel = message.channel;

        if (cfg.levelChannel) {
            const levelCh = message.guild.channels.cache.get(cfg.levelChannel);
            if (levelCh?.isTextBased()) targetChannel = levelCh;
        }

        if (!targetChannel?.isTextBased()) return;

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle("🎉 Niveau supérieur !")
            .setDescription(`Félicitations ${message.author} ! Tu passes au **niveau ${result.newLevel}** ! 🚀`)
            .setThumbnail(message.author.displayAvatarURL({ size: 128 }))
            .addFields(
                { name: "Niveau atteint", value: `**${result.newLevel}**`, inline: true },
                { name: "XP total", value: `**${result.xp}**`, inline: true }
            )
            .setTimestamp();

        await targetChannel.send({ embeds: [embed] }).catch(() => { });

        // Sync roles since user just spoke
        await syncMemberRoles(message.member).catch(() => { });
    },
};
