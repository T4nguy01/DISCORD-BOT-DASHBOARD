const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Modération",
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Lève le ban d'un utilisateur")
    .addStringOption(o => o.setName("user_id").setDescription("ID de l'utilisateur à débannir").setRequired(true))
    .addStringOption(o => o.setName("raison").setDescription("Raison").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "Cette commande est réservée aux serveurs.", ephemeral: true });
    }

    const userId = interaction.options.getString("user_id", true).trim();
    const reason = interaction.options.getString("raison") || "Aucune raison précisée";
    const bot = interaction.guild.members.me;

    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({ embeds: [errEmbed("ID invalide", "L'ID fourni ne correspond pas à un ID Discord valide (17-20 chiffres).")], ephemeral: true });
    }
    if (!bot.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ embeds: [errEmbed("Permission manquante", "Je n'ai pas la permission **Ban Members**.")], ephemeral: true });
    }

    const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
    if (!ban) {
      return interaction.reply({ embeds: [errEmbed("Non banni", "Cet utilisateur n'est pas dans la liste des bans.")], ephemeral: true });
    }

    await interaction.guild.bans.remove(userId, reason);

    const embed = new EmbedBuilder()
      .setColor(0x3ecf8e)
      .setTitle("✅ Ban levé")
      .addFields(
        { name: "Utilisateur", value: `${ban.user.tag} (\`${userId}\`)`, inline: true },
        { name: "Modérateur", value: `${interaction.user.tag}`, inline: true },
        { name: "Raison initiale du ban", value: ban.reason || "Non précisée" },
        { name: "Raison de la levée", value: reason }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};

function errEmbed(title, desc) {
  return new EmbedBuilder().setColor(0xf04e6a).setTitle(`❌ ${title}`).setDescription(desc);
}
