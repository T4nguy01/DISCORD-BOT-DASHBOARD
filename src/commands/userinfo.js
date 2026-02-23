const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Utilitaire",
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Affiche les informations détaillées d'un utilisateur")
    .addUserOption(o => o.setName("utilisateur").setDescription("Utilisateur cible (vous par défaut)").setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser("utilisateur") || interaction.user;
    const member = interaction.guild?.members.cache.get(user.id)
      || await interaction.guild?.members.fetch(user.id).catch(() => null);

    const createdAt = Math.floor(user.createdTimestamp / 1000);
    const joinedAt = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

    const topRole = member?.roles.highest.id !== interaction.guild?.id
      ? member?.roles.highest
      : null;

    const roleList = member
      ? [...member.roles.cache.values()]
        .filter(r => r.id !== interaction.guild?.id)
        .sort((a, b) => b.rawPosition - a.rawPosition)
        .slice(0, 8)
        .map(r => `${r}`)
        .join(" ") || "Aucun rôle"
      : "Non membre";

    const statusMap = { online: "🟢 En ligne", idle: "🟡 Absent", dnd: "🔴 Ne pas déranger", offline: "⚫ Hors ligne" };
    const status = member?.presence?.status ?? "offline";

    const embed = new EmbedBuilder()
      .setColor(topRole?.color || 0x5865f2)
      .setTitle(`👤 ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🆔 ID", value: user.id, inline: true },
        { name: "🤖 Bot", value: user.bot ? "Oui" : "Non", inline: true },
        { name: "📅 Compte créé", value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`, inline: true }
      );

    if (joinedAt) {
      embed.addFields({ name: "📥 A rejoint", value: `<t:${joinedAt}:D> (<t:${joinedAt}:R>)`, inline: true });
    }

    if (member) {
      embed.addFields(
        { name: "📶 Statut", value: statusMap[status] ?? "Inconnu", inline: true },
        { name: "🎖️ Rôle principal", value: topRole ? `${topRole}` : "Aucun", inline: true },
        { name: `🏷️ Rôles (${member.roles.cache.size - 1})`, value: roleList }
      );
    }

    embed.setTimestamp();
    return interaction.reply({ embeds: [embed] });
  },
};
