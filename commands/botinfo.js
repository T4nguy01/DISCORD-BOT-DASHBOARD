const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Infos de base sur le bot"),
  async execute(interaction) {
    const client = interaction.client;

    const lines = [
      `Nom: ${client.user.tag}`,
      `ID: ${client.user.id}`,
      `Serveurs: ${client.guilds.cache.size}`,
      `Latence WS: ${Math.round(client.ws.ping)} ms`,
    ];

    await interaction.reply({ content: lines.join("\n") });
  },
};
