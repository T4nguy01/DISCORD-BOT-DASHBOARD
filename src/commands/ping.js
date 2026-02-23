const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: "Utilitaire",
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Affiche la latence du bot et de l\'API Discord'),

    async execute(interaction) {
        const sent = await interaction.reply({
            content: 'Pinging...',
            fetchReply: true,
            ephemeral: true
        });

        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Latence du Bot', value: `${latency}ms`, inline: true },
                { name: 'Latence API', value: `${apiLatency}ms`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
