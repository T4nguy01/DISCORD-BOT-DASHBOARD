const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const configStore = require("../core/config-store");

module.exports = {
    category: "Administration",
    data: new SlashCommandBuilder()
        .setName("autorole")
        .setDescription("Gérer l'attribution automatique de rôle")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((sub) =>
            sub
                .setName("set")
                .setDescription("Définir le rôle automatique")
                .addRoleOption((opt) => opt.setName("role").setDescription("Rôle à attribuer").setRequired(true))
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove")
                .setDescription("Désactiver l'autorole")
        )
        .addSubcommand((sub) =>
            sub
                .setName("toggle")
                .setDescription("Activer ou désactiver l'autorole")
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const config = configStore.getGuildConfig(interaction.guildId);

        if (subcommand === "set") {
            const role = interaction.options.getRole("role");
            config.autoRoleId = role.id;
            config.autoRoleEnabled = true;
            configStore.saveGuildConfig(interaction.guildId, config);
            return interaction.reply({ content: `✅ Autorole configuré sur **${role.name}** et activé.`, ephemeral: true });
        }

        if (subcommand === "remove") {
            config.autoRoleId = "";
            config.autoRoleEnabled = false;
            configStore.saveGuildConfig(interaction.guildId, config);
            return interaction.reply({ content: `✅ Autorole supprimé et désactivé.`, ephemeral: true });
        }

        if (subcommand === "toggle") {
            if (!config.autoRoleId) {
                return interaction.reply({ content: "⚠️ Aucun rôle n'est configuré pour l'autorole.", ephemeral: true });
            }
            config.autoRoleEnabled = !config.autoRoleEnabled;
            configStore.saveGuildConfig(interaction.guildId, config);
            return interaction.reply({ content: `✅ Autorole ${config.autoRoleEnabled ? "activé" : "désactivé"}.`, ephemeral: true });
        }
    },
};
