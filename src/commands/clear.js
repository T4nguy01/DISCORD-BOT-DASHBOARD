const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Administration",
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Supprime des messages récents dans le salon")
    .addIntegerOption(o =>
      o.setName("nombre").setDescription("Nombre de messages à supprimer (1-100)")
        .setMinValue(1).setMaxValue(100).setRequired(true)
    )
    .addUserOption(o => o.setName("filtre").setDescription("Supprimer uniquement les messages de cet utilisateur").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "Cette commande est réservée aux serveurs.", ephemeral: true });
    }

    const amount = interaction.options.getInteger("nombre", true);
    const filterUser = interaction.options.getUser("filtre");
    const bot = interaction.guild.members.me;

    if (!bot.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ embeds: [errEmbed("Permission manquante", "Je n'ai pas la permission **Manage Messages**.")], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    let messages = await interaction.channel.messages.fetch({ limit: filterUser ? 100 : amount });
    if (filterUser) {
      messages = messages.filter(m => m.author.id === filterUser.id).first(amount);
    }

    const deleted = await interaction.channel.bulkDelete(messages, true).catch(() => null);
    const count = deleted?.size ?? 0;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🗑️ Messages supprimés")
      .addFields(
        { name: "Quantité", value: `**${count}** message(s) supprimé(s)`, inline: true },
        { name: "Salon", value: `${interaction.channel}`, inline: true }
      );

    if (filterUser) embed.addFields({ name: "Filtre utilisateur", value: filterUser.tag, inline: true });
    embed.setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};

function errEmbed(title, desc) {
  return new EmbedBuilder().setColor(0xf04e6a).setTitle(`❌ ${title}`).setDescription(desc);
}
