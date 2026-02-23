const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const CATEGORIES = {
  moderation: {
    label: "🛡️ Modération",
    commands: ["ban", "kick", "timeout", "unban", "clear"],
  },
  info: {
    label: "ℹ️ Informations",
    commands: ["serverinfo", "userinfo", "help"],
  },
};

module.exports = {
  category: "Utilitaire",
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Affiche toutes les commandes disponibles"),

  async execute(interaction) {
    const allCommands = interaction.client.commands;

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📖 Commandes disponibles")
      .setDescription("Toutes les commandes slash du bot, organisées par catégorie.")
      .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
      .setTimestamp()
      .setFooter({ text: `${allCommands.size} commande(s) disponible(s)` });

    for (const [, cat] of Object.entries(CATEGORIES)) {
      const lines = cat.commands
        .map(name => allCommands.get(name))
        .filter(Boolean)
        .map(cmd => `\`/${cmd.data.name}\` — ${cmd.data.description}`);

      if (lines.length) {
        embed.addFields({ name: cat.label, value: lines.join("\n") });
      }
    }

    // Commandes non catégorisées
    const categorized = Object.values(CATEGORIES).flatMap(c => c.commands);
    const others = [...allCommands.values()].filter(cmd => !categorized.includes(cmd.data.name));
    if (others.length) {
      embed.addFields({
        name: "📦 Autres",
        value: others.map(cmd => `\`/${cmd.data.name}\` — ${cmd.data.description}`).join("\n"),
      });
    }

    return interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
