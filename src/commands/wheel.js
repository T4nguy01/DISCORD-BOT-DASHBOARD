const {
    SlashCommandBuilder, EmbedBuilder, AttachmentBuilder,
    ActionRowBuilder, UserSelectMenuBuilder, ComponentType
} = require('discord.js');
const { generateAnimatedWheel } = require('../utils/wheel-generator');

module.exports = {
    category: "Fun",
    data: new SlashCommandBuilder()
        .setName('wheel')
        .setDescription('Lance une roue de la fortune animée')
        .addStringOption(opt => opt.setName('participants').setDescription('Liste manuelle (ex: Alice, Bob)'))
        .addRoleOption(opt => opt.setName('role').setDescription('Ajouter tous les membres d\'un rôle'))
        .addBooleanOption(opt => opt.setName('vocal').setDescription('Ajouter les membres de votre salon vocal'))
        .addBooleanOption(opt => opt.setName('video').setDescription('Générer une vidéo MP4 fluide au lieu d\'un GIF'))
        .addUserOption(o => o.setName('p1').setDescription('Personne 1'))
        .addUserOption(o => o.setName('p2').setDescription('Personne 2'))
        .addUserOption(o => o.setName('p3').setDescription('Personne 3')),

    async execute(interaction) {
        let participants = [];
        const isVideo = interaction.options.getBoolean('video') || false;

        // 1. Collect from options
        const manual = interaction.options.getString('participants');
        if (manual) participants.push(...manual.split(',').map(s => s.trim()).filter(Boolean));

        for (let i = 1; i <= 3; i++) {
            const u = interaction.options.getUser(`p${i}`);
            if (u) {
                const m = interaction.guild.members.cache.get(u.id);
                participants.push(m?.displayName || u.username);
            }
        }

        if (interaction.options.getBoolean('vocal')) {
            const vc = interaction.member?.voice?.channel;
            if (vc) participants.push(...vc.members.map(m => m.displayName));
        }

        const role = interaction.options.getRole('role');
        if (role) {
            // Ensure members are cached or fetched
            await interaction.guild.members.fetch();
            const roleMembers = role.members.map(m => m.displayName);
            participants.push(...roleMembers);
        }

        participants = [...new Set(participants)].filter(Boolean);

        // 2. Interactive Flow: If still empty, show User Select Menu
        if (participants.length === 0) {
            const select = new UserSelectMenuBuilder()
                .setCustomId('wheel_select')
                .setPlaceholder('Sélectionnez les participants pour la roue')
                .setMinValues(2)
                .setMaxValues(25);

            const row = new ActionRowBuilder().addComponents(select);

            const response = await interaction.reply({
                content: '✨ **Choisissez les participants** ci-dessous pour lancer la roue !',
                components: [row],
                ephemeral: true
            });

            const collector = response.createMessageComponentCollector({
                componentType: ComponentType.UserSelect,
                time: 60000
            });

            collector.on('collect', async i => {
                await i.deferUpdate();
                const selectedParticipants = i.members.map(m => m.displayName);
                await this.runWheel(i, selectedParticipants, isVideo);
                collector.stop();
            });

            return;
        }

        return this.runWheel(interaction, participants, isVideo);
    },

    async runWheel(interaction, participants, isVideo) {
        if (participants.length < 2) {
            const msg = '⚠️ Il faut au moins 2 participants !';
            return interaction.deferred || interaction.replied ? interaction.followUp({ content: msg, ephemeral: true }) : interaction.reply({ content: msg, ephemeral: true });
        }

        if (participants.length > 30) participants = participants.slice(0, 30);

        if (!interaction.deferred && !interaction.replied) await interaction.deferReply();
        else if (interaction.replied) await interaction.editReply({ content: '⚙️ Génération de la roue en cours...', components: [] });

        try {
            const winnerIndex = Math.floor(Math.random() * participants.length);
            const winner = participants[winnerIndex];
            const format = isVideo ? 'mp4' : 'gif';

            const buffer = await generateAnimatedWheel(participants, winnerIndex, format);
            const filename = `wheel.${format}`;
            const attachment = new AttachmentBuilder(buffer, { name: filename });

            const embed = new EmbedBuilder()
                .setColor(0x3ecf8e)
                .setTitle('🎡 Grande Roue de la Fortune')
                .setDescription(`L'aiguille s'arrête sur... **${winner}** ! 🎉`)
                .setImage(`attachment://${filename}`)
                .setFooter({ text: `Lancé par ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ content: null, embeds: [embed], files: [attachment], components: [] });
        } catch (error) {
            console.error('[WheelCommand] Error:', error);
            const errorMsg = '❌ Une erreur est survenue lors de la génération de la roue.';
            interaction.replied ? await interaction.editReply({ content: errorMsg, components: [] }) : await interaction.reply({ content: errorMsg, ephemeral: true });
        }
    }
};
