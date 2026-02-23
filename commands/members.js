const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    category: "Utilitaire",
    data: new SlashCommandBuilder()
        .setName("members")
        .setDescription("Affiche le nombre total de membres du serveur"),

    async execute(interaction) {
        const guild = interaction.guild;
        const total = guild.member_count;

        const embed = new EmbedBuilder()
            .setTitle("👥 Membres du serveur")
            .setDescription(`Le serveur **${guild.name}** compte **${total} membres**.`)
            .setColor(0x5865f2)
            .setFooter({ text: `ID du serveur : ${guild.id}` });

        if (guild.iconURL()) {
            embed.setThumbnail(guild.iconURL());
        }

        await interaction.reply({ embeds: [embed] });
    },
};
