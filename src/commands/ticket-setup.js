const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const configStore = require("../core/config-store");

module.exports = {
    category: "Administration",
    data: new SlashCommandBuilder()
        .setName("ticket-setup")
        .setDescription("Envoie le message de configuration du système de tickets")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const config = configStore.getGuildConfig(interaction.guildId);

        if (!config.ticketCategoryId) {
            return interaction.reply({
                content: "⚠️ Le système de tickets n'est pas configuré. Veuillez définir une catégorie de tickets via le dashboard.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("Système de Support")
            .setDescription("Besoin d'aide ? Cliquez sur le bouton ci-dessous pour ouvrir un ticket de support privé.")
            .setFooter({ text: "Notre équipe vous répondra dès que possible." });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("ticket_open")
                .setLabel("Ouvrir un ticket")
                .setStyle(ButtonStyle.Primary)
                .setEmoji("🎫")
        );

        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({ content: "✅ Système de tickets envoyé dans ce salon.", ephemeral: true });
    },
};
