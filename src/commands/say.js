const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Le bot repete ton message")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message a envoyer")
        .setRequired(true)
    ),
  async execute(interaction) {
    const message = interaction.options.getString("message", true);

    await interaction.reply({ content: "Message envoye.", ephemeral: true });
    await interaction.channel.send({ content: message });
  },
};
