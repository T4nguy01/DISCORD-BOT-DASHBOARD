const { Events } = require("discord.js");
const { createTicket, closeTicket } = require("../utils/ticket-utils");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const { customId } = interaction;

        if (customId === "ticket_open") {
            try {
                await interaction.deferReply({ ephemeral: true });
                const channel = await createTicket(interaction.guild, interaction.user);
                await interaction.editReply({ content: `✅ Votre ticket a été créé : ${channel}` });
            } catch (error) {
                console.error("[Ticket] Error opening ticket:", error.message);
                await interaction.editReply({ content: `❌ Erreur : ${error.message}` });
            }
        }

        if (customId === "ticket_close") {
            try {
                await interaction.deferUpdate();
                await closeTicket(interaction.channel, interaction.user);
            } catch (error) {
                console.error("[Ticket] Error closing ticket:", error.message);
            }
        }
    },
};
