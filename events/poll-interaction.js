const { Events, EmbedBuilder } = require('discord.js');

// Simple in-memory storage for poll results (cleared on restart)
const polls = new Map();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (!['poll_yes', 'poll_no'].includes(interaction.customId)) return;

        const messageId = interaction.message.id;
        if (!polls.has(messageId)) {
            polls.set(messageId, { yes: new Set(), no: new Set() });
        }

        const pollData = polls.get(messageId);

        if (interaction.customId === 'poll_yes') {
            if (pollData.no.has(interaction.user.id)) pollData.no.delete(interaction.user.id);
            pollData.yes.add(interaction.user.id);
        } else {
            if (pollData.yes.has(interaction.user.id)) pollData.yes.delete(interaction.user.id);
            pollData.no.add(interaction.user.id);
        }

        const yesCount = pollData.yes.size;
        const noCount = pollData.no.size;

        const originalEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(originalEmbed)
            .setFields([
                { name: '✅ Oui', value: `${yesCount}`, inline: true },
                { name: '❌ Non', value: `${noCount}`, inline: true }
            ]);

        await interaction.update({ embeds: [updatedEmbed] });
    },
};
