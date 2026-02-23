const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Modération",
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulse un membre du serveur")
    .addUserOption(o => o.setName("membre").setDescription("Membre à expulser").setRequired(true))
    .addStringOption(o => o.setName("raison").setDescription("Raison de l'expulsion").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "Cette commande est réservée aux serveurs.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("membre", true);
    const reason = interaction.options.getString("raison") || "Aucune raison précisée";
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    const bot = interaction.guild.members.me;
    const mod = interaction.member;

    if (!member) {
      return interaction.reply({ embeds: [errEmbed("Introuvable", "Ce membre n'est pas sur le serveur.")], ephemeral: true });
    }
    if (!bot.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ embeds: [errEmbed("Permission manquante", "Je n'ai pas la permission **Kick Members**.")], ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({ embeds: [errEmbed("Action impossible", "Je ne peux pas expulser ce membre.")], ephemeral: true });
    }
    if (mod.roles.highest.comparePositionTo(member.roles.highest) <= 0 && interaction.guild.ownerId !== mod.id) {
      return interaction.reply({ embeds: [errEmbed("Permission insuffisante", "Tu ne peux pas expulser un membre avec un rôle égal ou supérieur au tien.")], ephemeral: true });
    }

    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xf5a623)
      .setTitle("👢 Membre expulsé")
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "Utilisateur", value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
        { name: "Modérateur", value: `${interaction.user.tag}`, inline: true },
        { name: "Raison", value: reason }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};

function errEmbed(title, desc) {
  return new EmbedBuilder().setColor(0xf04e6a).setTitle(`❌ ${title}`).setDescription(desc);
}
