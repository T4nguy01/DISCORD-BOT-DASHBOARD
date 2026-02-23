const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const xpStore = require("../core/xp-store");

module.exports = {
    category: "Système XP",
    data: new SlashCommandBuilder()
        .setName("rank")
        .setDescription("Affiche ton niveau et tes points XP")
        .addUserOption(o =>
            o.setName("utilisateur").setDescription("Membre à consulter (toi par défaut)").setRequired(false)
        ),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "Cette commande est réservée aux serveurs.", ephemeral: true });
        }

        const target = interaction.options.getUser("utilisateur") || interaction.user;
        const data = xpStore.getUser(interaction.guild.id, target.id);
        const rank = xpStore.getRank(interaction.guild.id, target.id);

        const currentLevelXp = xpStore.xpIntoLevel(data.xp);
        const neededXp = xpStore.xpForLevel(data.level);
        const pct = neededXp > 0 ? Math.min(100, Math.round((currentLevelXp / neededXp) * 100)) : 0;

        // ASCII progress bar (20 chars)
        const filled = Math.round(pct / 5);
        const bar = "█".repeat(filled) + "░".repeat(20 - filled);

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`📈 Rank — ${target.tag}`)
            .setThumbnail(target.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: "🏆 Classement", value: rank ? `**#${rank}**` : "Non classé", inline: true },
                { name: "⭐ Niveau", value: `**${data.level}**`, inline: true },
                { name: "💎 XP total", value: `**${data.xp}**`, inline: true },
                {
                    name: `Progression vers le niveau ${data.level + 1} (${pct}%)`,
                    value: `\`${bar}\`\n${currentLevelXp} / ${neededXp} XP`
                }
            )
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    },
};
