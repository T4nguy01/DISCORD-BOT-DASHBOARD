const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("uptime")
    .setDescription("Affiche le temps de fonctionnement du bot"),
  async execute(interaction) {
    const totalSeconds = Math.floor(process.uptime());
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    await interaction.reply({
      content: `Uptime: ${days}j ${hours}h ${minutes}m ${seconds}s`,
    });
  },
};
