const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require("discord.js");
const configStore = require("../config-store");

module.exports = {
    category: "Administration",
    data: new SlashCommandBuilder()
        .setName("role-setup")
        .setDescription("Envoie le message de sélection des rôles en libre-service")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const config = configStore.getGuildConfig(interaction.guildId);

        if (!config.selfRoles || config.selfRoles.length === 0) {
            return interaction.reply({
                content: "⚠️ Aucun rôle n'a été configuré pour le libre-service. Veuillez les définir via le dashboard.",
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle("Sélection des Rôles")
            .setDescription("Utilisez le menu ci-dessous pour choisir vos rôles. Vous pouvez en sélectionner plusieurs !")
            .setFooter({ text: "Sélectionnez à nouveau un rôle pour le retirer." });

        // Map role IDs to options for the select menu
        const options = config.selfRoles.map(roleId => {
            const role = interaction.guild.roles.cache.get(roleId);
            return {
                label: role ? role.name : "Rôle inconnu",
                value: roleId,
                description: `Cliquez pour obtenir ou retirer le rôle ${role ? role.name : roleId}`
            };
        }).filter(opt => opt.label !== "Rôle inconnu");

        if (options.length === 0) {
            return interaction.reply({
                content: "⚠️ Les rôles configurés sont introuvables sur ce serveur.",
                ephemeral: true
            });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("role_select")
            .setPlaceholder("Choisissez vos rôles...")
            .setMinValues(0)
            .setMaxValues(options.length)
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.channel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.reply({ content: "✅ Menu de sélection des rôles envoyé.", ephemeral: true });
    },
};
