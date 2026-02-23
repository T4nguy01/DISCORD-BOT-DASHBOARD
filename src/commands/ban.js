const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Modération",
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bannit un membre du serveur")
    .addUserOption(o => o.setName("membre").setDescription("Membre à bannir").setRequired(true))
    .addStringOption(o => o.setName("raison").setDescription("Raison du ban").setRequired(false))
    .addIntegerOption(o =>
      o.setName("supprimer_messages")
        .setDescription("Nombre de jours de messages à supprimer (0-7)")
        .setMinValue(0).setMaxValue(7).setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "Cette commande est réservée aux serveurs.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("membre", true);
    const reason = interaction.options.getString("raison") || "Aucune raison précisée";
    const deleteDays = interaction.options.getInteger("supprimer_messages") ?? 0;
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    const bot = interaction.guild.members.me;
    const mod = interaction.member;

    if (!bot.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ embeds: [errEmbed("Permission manquante", "Je n'ai pas la permission **Ban Members**.")], ephemeral: true });
    }
    if (member) {
      if (!member.bannable) {
        return interaction.reply({ embeds: [errEmbed("Action impossible", "Je ne peux pas bannir ce membre (rôle supérieur ou égal au mien).")], ephemeral: true });
      }
      if (mod.roles.highest.comparePositionTo(member.roles.highest) <= 0 && interaction.guild.ownerId !== mod.id) {
        return interaction.reply({ embeds: [errEmbed("Permission insuffisante", "Tu ne peux pas bannir un membre avec un rôle égal ou supérieur au tien.")], ephemeral: true });
      }
    }

    await interaction.guild.members.ban(targetUser.id, { deleteMessageSeconds: deleteDays * 86400, reason });

    const embed = new EmbedBuilder()
      .setColor(0xf04e6a)
      .setTitle("🔨 Membre banni")
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "Utilisateur", value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
        { name: "Modérateur", value: `${interaction.user.tag}`, inline: true },
        { name: "Raison", value: reason },
        { name: "Messages supprimés", value: `${deleteDays} jour(s)`, inline: true }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};

function errEmbed(title, desc) {
  return new EmbedBuilder().setColor(0xf04e6a).setTitle(`❌ ${title}`).setDescription(desc);
}
