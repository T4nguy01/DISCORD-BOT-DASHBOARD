const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    category: "Utilitaire",
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Crée un sondage simple')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('La question du sondage')
                .setRequired(true)),

    async execute(interaction) {
        const question = interaction.options.getString('question');

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('📊 Sondage')
            .setDescription(question)
            .setFooter({ text: `Sondage lancé par ${interaction.user.username}` })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('poll_yes')
                .setLabel('Oui')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅'),
            new ButtonBuilder()
                .setCustomId('poll_no')
                .setLabel('Non')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌')
        );

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
