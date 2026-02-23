const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { generateAnimatedWheel } = require('../utils/wheel-generator');

module.exports = {
    category: "Fun",
    data: new SlashCommandBuilder()
        .setName('wheel')
        .setDescription('Lance une roue de la fortune animée')
        .addStringOption(option =>
            option.setName('participants')
                .setDescription('Liste des participants séparés par des virgules (ex: Alice, Bob, Charlie)')
                .setRequired(true)),

    async execute(interaction) {
        const input = interaction.options.getString('participants');
        const participants = input.split(',').map(s => s.trim()).filter(s => s.length > 0);

        if (participants.length < 2) {
            return interaction.reply({ content: '⚠️ Il faut au moins 2 participants pour lancer la roue.', ephemeral: true });
        }

        if (participants.length > 30) {
            return interaction.reply({ content: '⚠️ Maximum 30 participants pour une meilleure lisibilité.', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const winnerIndex = Math.floor(Math.random() * participants.length);
            const winner = participants[winnerIndex];

            const buffer = await generateAnimatedWheel(participants, winnerIndex);
            const attachment = new AttachmentBuilder(buffer, { name: 'wheel.gif' });

            const embed = new EmbedBuilder()
                .setColor(0x00AE86)
                .setTitle('🎡 Roue de la Fortune')
                .setDescription(`Et le gagnant est... **${winner}** ! 🎉`)
                .setImage('attachment://wheel.gif')
                .setFooter({ text: `Lancé par ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (error) {
            console.error('[WheelCommand] Error:', error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de la génération de la roue.' });
        }
    }
};
