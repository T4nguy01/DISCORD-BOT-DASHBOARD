const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const DURATIONS = [
  { name: "1 minute", value: "60", ms: 60_000 },
  { name: "5 minutes", value: "300", ms: 300_000 },
  { name: "10 minutes", value: "600", ms: 600_000 },
  { name: "30 minutes", value: "1800", ms: 1_800_000 },
  { name: "1 heure", value: "3600", ms: 3_600_000 },
  { name: "6 heures", value: "21600", ms: 21_600_000 },
  { name: "24 heures", value: "86400", ms: 86_400_000 },
];

module.exports = {
  category: "Modération",
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Met un membre en timeout (silence temporaire)")
    .addUserOption(o => o.setName("membre").setDescription("Membre cible").setRequired(true))
    .addStringOption(o =>
      o.setName("duree").setDescription("Durée du timeout").setRequired(true)
        .addChoices(...DURATIONS.map(d => ({ name: d.name, value: d.value })))
    )
    .addStringOption(o => o.setName("raison").setDescription("Raison").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "Cette commande est réservée aux serveurs.", ephemeral: true });
    }

    const targetUser = interaction.options.getUser("membre", true);
    const durationKey = interaction.options.getString("duree", true);
    const reason = interaction.options.getString("raison") || "Aucune raison précisée";
    const dur = DURATIONS.find(d => d.value === durationKey);
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    const bot = interaction.guild.members.me;
    const mod = interaction.member;

    if (!member) {
      return interaction.reply({ embeds: [errEmbed("Introuvable", "Ce membre n'est pas sur le serveur.")], ephemeral: true });
    }
    if (!bot.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ embeds: [errEmbed("Permission manquante", "Je n'ai pas la permission **Moderate Members**.")], ephemeral: true });
    }
    if (!member.moderatable) {
      return interaction.reply({ embeds: [errEmbed("Action impossible", "Je ne peux pas mettre ce membre en timeout.")], ephemeral: true });
    }
    if (mod.roles.highest.comparePositionTo(member.roles.highest) <= 0 && interaction.guild.ownerId !== mod.id) {
      return interaction.reply({ embeds: [errEmbed("Permission insuffisante", "Tu ne peux pas timeout un membre avec un rôle égal ou supérieur au tien.")], ephemeral: true });
    }

    await member.timeout(dur.ms, reason);

    const until = Math.floor((Date.now() + dur.ms) / 1000);
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("⏱️ Timeout appliqué")
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "Utilisateur", value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
        { name: "Modérateur", value: `${interaction.user.tag}`, inline: true },
        { name: "Durée", value: dur.name, inline: true },
        { name: "Expire", value: `<t:${until}:R>`, inline: true },
        { name: "Raison", value: reason }
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};

function errEmbed(title, desc) {
  return new EmbedBuilder().setColor(0xf04e6a).setTitle(`❌ ${title}`).setDescription(desc);
}
