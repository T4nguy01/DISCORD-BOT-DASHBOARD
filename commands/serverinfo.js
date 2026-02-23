const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  category: "Utilitaire",
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Affiche les informations détaillées du serveur"),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: "Cette commande est réservée aux serveurs.", ephemeral: true });
    }

    await interaction.deferReply();

    let members = [];
    let partial = false;
    try {
      const fetched = await guild.members.fetch();
      members = [...fetched.values()];
    } catch {
      partial = true;
      members = [...guild.members.cache.values()];
    }

    const humans = members.filter(m => !m.user.bot).length;
    const bots = members.filter(m => m.user.bot).length;
    const roles = [...guild.roles.cache.values()].filter(r => r.id !== guild.id);
    const withoutRole = members.filter(m => m.roles.cache.size <= 1).length;

    const topRoles = roles
      .sort((a, b) => b.members.size - a.members.size)
      .slice(0, 5)
      .map(r => `${r} — ${r.members.size} membre(s)`)
      .join("\n") || "Aucun rôle";

    const verificationLevels = { 0: "Aucune", 1: "Faible", 2: "Moyenne", 3: "Élevée", 4: "Très élevée" };
    const createdAt = Math.floor(guild.createdTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: "🆔 ID", value: guild.id, inline: true },
        { name: "👑 Propriétaire", value: `<@${guild.ownerId}>`, inline: true },
        { name: "📅 Créé le", value: `<t:${createdAt}:D> (<t:${createdAt}:R>)`, inline: true },
        { name: "👥 Membres", value: `${guild.memberCount} total\n${humans} humains · ${bots} bots`, inline: true },
        { name: "🏷️ Rôles", value: `${roles.length} rôles\n${withoutRole} sans rôle`, inline: true },
        { name: "🔒 Vérification", value: verificationLevels[guild.verificationLevel] ?? "Inconnue", inline: true },
        { name: "🏆 Top 5 rôles", value: topRoles }
      )
      .setFooter({ text: partial ? "⚠️ Données partielles (cache incomplet)" : "Données complètes" })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
