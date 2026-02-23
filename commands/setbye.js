const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { updateGuildConfig } = require("../config-store");

module.exports = {
    category: "Administration",
    data: new SlashCommandBuilder()
        .setName("setbye")
        .setDescription("Configure le salon des messages d'au revoir")
        .addChannelOption(o =>
            o.setName("salon").setDescription("Salon où envoyer les messages d'au revoir (vide = désactiver)").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel("salon");

        if (!channel) {
            updateGuildConfig(interaction.guild.id, { byeChannel: "" });
            const embed = new EmbedBuilder()
                .setColor(0xf5a623)
                .setTitle("⚙️ Bye désactivé")
                .setDescription("Les messages d'au revoir ont été **désactivés**.");
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!channel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setColor(0xf04e6a).setTitle("❌ Salon invalide")
                .setDescription("Le salon doit être un salon textuel.");
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        updateGuildConfig(interaction.guild.id, { byeChannel: channel.id });

        const embed = new EmbedBuilder()
            .setColor(0x3ecf8e)
            .setTitle("✅ Bye configuré")
            .setDescription(`Les messages d'au revoir seront envoyés dans ${channel}.`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
