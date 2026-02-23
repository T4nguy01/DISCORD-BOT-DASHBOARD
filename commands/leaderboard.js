const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const xpStore = require("../xp-store");

const MEDALS = ["🥇", "🥈", "🥉"];

module.exports = {
    category: "Système XP",
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Classement XP du serveur (top 10)"),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "Cette commande est réservée aux serveurs.", ephemeral: true });
        }

        await interaction.deferReply();

        const top = xpStore.getLeaderboard(interaction.guild.id, 10);

        if (!top.length) {
            const embed = new EmbedBuilder()
                .setColor(0x5865f2)
                .setTitle("🏆 Classement XP")
                .setDescription("Aucune donnée XP pour ce serveur. Commencez à discuter !");
            return interaction.editReply({ embeds: [embed] });
        }

        const lines = top.map((entry, i) => {
            const medal = MEDALS[i] ?? `**${i + 1}.**`;
            return `${medal} <@${entry.userId}> — Niveau **${entry.level}** · ${entry.xp} XP`;
        });

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`🏆 Classement XP — ${interaction.guild.name}`)
            .setDescription(lines.join("\n"))
            .setThumbnail(interaction.guild.iconURL({ size: 256 }))
            .setFooter({ text: `Top ${top.length} membres` })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    },
};
