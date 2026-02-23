const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { updateGuildConfig } = require("../config-store");

module.exports = {
    category: "Administration",
    data: new SlashCommandBuilder()
        .setName("setlevelchannel")
        .setDescription("Configure le salon des annonces de niveau supérieur")
        .addChannelOption(o =>
            o.setName("salon").setDescription("Salon où envoyer les messages de level-up (vide = salon actuel)").setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const channel = interaction.options.getChannel("salon");

        if (!channel) {
            updateGuildConfig(interaction.guild.id, { levelChannel: "" });
            const embed = new EmbedBuilder()
                .setColor(0xf5a623)
                .setTitle("⚙️ Level Channel réinitialisé")
                .setDescription("Les annonces de niveau seront envoyées dans le **salon actuel**.");
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!channel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setColor(0xf04e6a).setTitle("❌ Salon invalide")
                .setDescription("Le salon doit être un salon textuel.");
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        updateGuildConfig(interaction.guild.id, { levelChannel: channel.id });

        const embed = new EmbedBuilder()
            .setColor(0x3ecf8e)
            .setTitle("✅ Level Channel configuré")
            .setDescription(`Les annonces de niveau seront envoyées dans ${channel}.`)
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    },
};
