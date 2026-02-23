const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    category: "Utilitaire",
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Affiche l\'avatar d\'un utilisateur')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur dont vous voulez voir l\'avatar')
                .setRequired(false)),

    async execute(interaction) {
        const user = interaction.options.getUser('utilisateur') || interaction.user;

        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle(`Avatar de ${user.username}`)
            .setImage(avatarUrl)
            .setFooter({ text: `Demandé par ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
